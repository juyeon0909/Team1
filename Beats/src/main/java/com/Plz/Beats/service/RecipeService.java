package com.Plz.Beats.service;

import com.Plz.Beats.constant.ApprovalStatus;
import com.Plz.Beats.constant.Category;
import com.Plz.Beats.dto.AdminRecipeDto;
import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.RecipeIngredient;
import com.Plz.Beats.entity.Item;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.RecipeLikeRepository;
import com.Plz.Beats.repository.RecipeRepository;
import com.Plz.Beats.repository.ScrapRepository;
import com.Plz.Beats.repository.ItemRepository;
import com.Plz.Beats.repository.StorageItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.Plz.Beats.constant.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final MemberRepository memberRepository;
    private final ItemRepository itemRepository;
    private final RecipeLikeRepository recipeLikeRepository;
    private final ScrapRepository scrapRepository;
    private final S3Service s3Service;
    private final StorageItemRepository storageItemRepository;
    private final MailService mailService;

    /**
     * Recipe → RecipeDto 변환 (2-파라미터). 임박 판정 없이 urgent=false.
     * 스크랩/좋아요 목록, 상세 조회 등 임박 표시가 필요 없는 곳에서 사용.
     */
    public RecipeDto toDto(Recipe recipe, Member currentMember) {
        return toDto(recipe, currentMember, Collections.emptySet());
    }

    /**
     * Recipe → RecipeDto 변환 (3-파라미터). urgentItemIds로 임박 여부 판정.
     *
     * @param recipe        변환할 레시피
     * @param currentMember 현재 로그인 회원 (비로그인이면 null) — hearted/scrapped 판정용
     * @param urgentItemIds 유통기한 임박(3일 이내) 재료 item.id 집합 (없으면 빈 집합)
     */
    public RecipeDto toDto(Recipe recipe, Member currentMember, Set<Long> urgentItemIds) {
        RecipeDto dto = new RecipeDto();
        dto.setId(recipe.getId());
        dto.setTitle(recipe.getTitle());
        dto.setDishName(recipe.getDishName());
        dto.setCategory(recipe.getCategory().name());
        dto.setCookingTime(recipe.getCookingTime());
        dto.setDescription(recipe.getDescription());
        dto.setImage(recipe.getImage());
        dto.setAuthor(recipe.getMember().getName());

        if (recipe.getCookingMethod() != null) {
            dto.setSteps(Arrays.asList(recipe.getCookingMethod().split("\n")));
        }

        List<RecipeDto.MustIngredientDto> ingDtos = recipe.getRecipeIngredients().stream()
                .filter(ing -> ing.isRequired())
                .map(ing -> new RecipeDto.MustIngredientDto(
                        ing.getItem() != null ? ing.getItem().getName() : "알 수 없는 재료",
                        ing.getQuantity()
                ))
                .collect(Collectors.toList());
        dto.setMustIngredients(ingDtos);

        List<RecipeDto.SelectIngredientDto> selectDtos = recipe.getRecipeIngredients().stream()
                .filter(ing -> !ing.isRequired())
                .map(ing -> new RecipeDto.SelectIngredientDto(
                        ing.getItem() != null ? ing.getItem().getName() : "알 수 없는 재료",
                        ing.getQuantity()
                ))
                .collect(Collectors.toList());
        dto.setSelectIngredients(selectDtos);

        dto.setLikeCount(recipeLikeRepository.countByRecipe(recipe));
        dto.setScrapCount(scrapRepository.countByRecipe(recipe));

        if (currentMember != null) {
            dto.setHearted(recipeLikeRepository.findByMemberAndRecipe(currentMember, recipe).isPresent());
            dto.setScrapped(scrapRepository.findByMemberAndRecipe(currentMember, recipe).isPresent());
        } else {
            dto.setHearted(false);
            dto.setScrapped(false);
        }

        // 임박 재료가 이 레시피 재료에 하나라도 포함되면 urgent
        boolean urgent = false;
        if (urgentItemIds != null && !urgentItemIds.isEmpty()) {
            urgent = recipe.getRecipeIngredients().stream()
                    .anyMatch(ing -> ing.getItem() != null && urgentItemIds.contains(ing.getItem().getId()));
        }
        dto.setUrgent(urgent);

        return dto;
    }

    // 로그인 유저의 임박 재료(유통기한 3일 이내) item.id 집합
    private Set<Long> getUrgentItemIds(Member member) {
        if (member == null) return Collections.emptySet();
        LocalDate limit = LocalDate.now().plusDays(3);
        return new HashSet<>(
                storageItemRepository.findUrgentItemIdsByMemberEmail(member.getEmail(), limit));
    }


    // 레시피 등록
    @Transactional
    public RecipeDto createRecipe(RecipeDto dto, String username) {
        if ("GUEST".equals(username) || username == null) {
            throw new IllegalArgumentException("레시피 등록 및 수정은 로그인 후 이용 가능합니다.");
        }

        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Recipe recipe = new Recipe();
        recipe.setMember(member);
        recipe.setTitle(dto.getTitle());
        recipe.setDishName(dto.getDishName() != null ? dto.getDishName() : dto.getTitle());
        recipe.setImage(dto.getImage() != null && !dto.getImage().isEmpty()
                ? dto.getImage()
                : "https://in-my-fridge-image-bucket.s3.ap-northeast-2.amazonaws.com/default.png");
        recipe.setCategory(Category.valueOf(dto.getCategory()));
        recipe.setCookingTime(dto.getCookingTime());
        recipe.setDescription(dto.getDescription());
        recipe.setApprovalStatus(ApprovalStatus.PENDING);
        recipe.setUpdatedAt(LocalDateTime.now());

        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            recipe.setCookingMethod(String.join("\n", dto.getSteps()));
        } else {
            recipe.setCookingMethod("1. 맛있게 요리합니다.");
        }

        if (dto.getMustIngredients() != null) {
            for (RecipeDto.MustIngredientDto ingDto : dto.getMustIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                Item item = itemRepository.findByName(ingDto.getName().trim())
                        .orElseGet(() -> {
                            Item newItem = new Item();
                            newItem.setName(ingDto.getName().trim());
                            return itemRepository.save(newItem);
                        });
                ingredient.setItem(item);
                ingredient.setQuantity(ingDto.getQuantity());
                ingredient.setUnit("g");
                ingredient.setRequired(true);
                ingredient.setRecipe(recipe);
                recipe.getRecipeIngredients().add(ingredient);
            }
        }
        if (dto.getSelectIngredients() != null) {
            for (RecipeDto.SelectIngredientDto ingDto : dto.getSelectIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                Item item = itemRepository.findByName(ingDto.getName().trim())
                        .orElseGet(() -> {
                            Item newItem = new Item();
                            newItem.setName(ingDto.getName().trim());
                            return itemRepository.save(newItem);
                        });
                ingredient.setItem(item);
                ingredient.setQuantity(ingDto.getQuantity());
                ingredient.setUnit("g");
                ingredient.setRequired(false);
                ingredient.setRecipe(recipe);
                recipe.getRecipeIngredients().add(ingredient);
            }
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        dto.setId(savedRecipe.getId());
        return dto;
    }

    // 레시피 수정 (본인만 가능, 수정 시 다시 승인 대기로)
    @Transactional
    public RecipeDto updateRecipe(Long id, RecipeDto dto, String username) {
        if ("GUEST".equals(username) || username == null) {
            throw new IllegalArgumentException("레시피 수정은 로그인 후 이용 가능합니다.");
        }

        Member requester = memberRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        // 관리자가 아니면 본인만 수정 가능
        boolean isAdmin = requester.getRole() == Role.ADMIN;
        if (!isAdmin && !recipe.getMember().getEmail().equals(username)) {
            throw new IllegalArgumentException("본인이 등록한 레시피만 수정할 수 있습니다.");
        }

        // 수정전에 백업본을 변수에 복사하기
        String beforeTitle    = recipe.getTitle();
        String beforeCategory = recipe.getCategory().getDescription(); // 한글
        Integer beforeTime    = recipe.getCookingTime();
        String beforeDesc     = recipe.getDescription();
        String beforeSteps    = recipe.getCookingMethod();
        String beforeIngredients = recipe.getRecipeIngredients().stream()
                .map(ing -> ing.getItem() != null ? ing.getItem().getName() : "")
                .collect(java.util.stream.Collectors.joining(", "));

        // 실제 수정 작업
        recipe.setTitle(dto.getTitle());
        recipe.setDishName(dto.getDishName() != null ? dto.getDishName() : dto.getTitle());
        if (dto.getImage() != null && !dto.getImage().isEmpty()) {
            recipe.setImage(dto.getImage());
        }
        recipe.setCategory(Category.valueOf(dto.getCategory()));
        recipe.setCookingTime(dto.getCookingTime());
        recipe.setDescription(dto.getDescription());
        recipe.setApprovalStatus(ApprovalStatus.PENDING);
        recipe.setUpdatedAt(LocalDateTime.now());

        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            recipe.setCookingMethod(String.join("\n", dto.getSteps()));
        }

        recipe.getRecipeIngredients().clear();
        if (dto.getMustIngredients() != null) {
            for (RecipeDto.MustIngredientDto ingDto : dto.getMustIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                Item item = itemRepository.findByName(ingDto.getName().trim())
                        .orElseGet(() -> {
                            Item newItem = new Item();
                            newItem.setName(ingDto.getName().trim());
                            return itemRepository.save(newItem);
                        });
                ingredient.setItem(item);
                ingredient.setQuantity(ingDto.getQuantity());
                ingredient.setUnit("g");
                ingredient.setRequired(true);
                ingredient.setRecipe(recipe);
                recipe.getRecipeIngredients().add(ingredient);
            }
        }

        // 수정 후 현재 값 저장하기
        String afterCategory = Category.valueOf(dto.getCategory()).getDescription(); // 한글
        String afterSteps    = recipe.getCookingMethod();
        String afterIngredients = recipe.getRecipeIngredients().stream()
                .map(ing -> ing.getItem() != null ? ing.getItem().getName() : "")
                .collect(java.util.stream.Collectors.joining(", "));

        // 변경 알림 보내기 (수정 유무와 관계없이 무조건 발송)
        // 여기는 알림이라 실제 작업은 XX
        String to = recipe.getMember().getEmail();
        String subject = "[레시피 수정 알림] \"" + dto.getTitle() + "\" 레시피가 수정되었습니다.";
        String body = buildRecipeDiffMail(
                recipe.getMember().getName(),
                beforeTitle,    dto.getTitle(),
                beforeCategory, afterCategory,
                beforeTime,     dto.getCookingTime(),
                beforeDesc,     dto.getDescription(),
                beforeSteps,    afterSteps,
                beforeIngredients, afterIngredients
        );
        mailService.sendMail(to, subject, body);

        dto.setId(recipe.getId());
        return dto;
    }

    // 수정 전 후 비교 이메일 본문 생성
    private String buildRecipeDiffMail(
            String author,
            String beforeTitle, String afterTitle,
            String beforeCategory, String afterCategory,
            Integer beforeTime, Integer afterTime,
            String beforeDesc, String afterDesc,
            String beforeSteps, String afterSteps,
            String beforeIngredients, String afterIngredients) {

        StringBuilder sb = new StringBuilder();
        sb.append(author).append("님, 등록하신 레시피가 관리자에 의해 수정되었습니다.\n");
        sb.append("──────────────────────────────\n");
        sb.append(field("제목", beforeTitle, afterTitle));
        sb.append(field("카테고리", beforeCategory, afterCategory));
        sb.append(field("조리시간", beforeTime + "분", afterTime + "분"));
        sb.append(field("소개", beforeDesc, afterDesc));
        sb.append(field("재료", beforeIngredients, afterIngredients));
        sb.append(field("조리방법", beforeSteps, afterSteps));
        return sb.toString();
    }

    private String field(String label, String before, String after) {
        String b = (before == null || before.isBlank()) ? "(없음)" : before;
        String a = (after == null || after.isBlank()) ? "(없음)" : after;
        return "▶ " + label + "\n"
                + "변경 전 : \n   " + b + "\n\n"
                + "변경 후 : \n   " + a + "\n\n"
                + "──────────────────────────────\n";
    }

    // 승인된 레시피 목록 조회 (메인 — 임박 판정 포함)
    public List<RecipeDto> getRecipes(String username) {
        List<Recipe> recipes = recipeRepository.findByApprovalStatus(ApprovalStatus.APPROVED);

        Member member = null;
        if (!"GUEST".equals(username)) {
            member = memberRepository.findByEmail(username).orElse(null);
        }
        final Member currentMember = member;
        final Set<Long> urgentItemIds = getUrgentItemIds(currentMember);   // 한 번만 조회

        return recipes.stream()
                .map(recipe -> toDto(recipe, currentMember, urgentItemIds))
                .collect(Collectors.toList());
    }

    // 내가 등록한 레시피 목록 조회 (마이페이지용)
    public List<RecipeDto> getMyRecipes(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<Recipe> myRecipes = recipeRepository.findByMember(member);

        return myRecipes.stream()
                .map(recipe -> toDto(recipe, member))
                .collect(Collectors.toList());
    }

    // 레시피 단건 상세 조회 (로그인 유저 기준 hearted/scrapped 판정)
    public RecipeDto getRecipeDetail(Long id, String username) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        Member member = null;
        if (username != null && !"GUEST".equals(username)) {
            member = memberRepository.findByEmail(username).orElse(null);
        }

        // 임박 재료도 같이 판정하려면 집합 전달 (상세에서도 urgent 보고 싶으면)
        RecipeDto dto = toDto(recipe, member, getUrgentItemIds(member));

        // 없는 재료 계산: 내 보관함에 없는 필수 재료
        if (member != null) {
            Set<Long> myItemIds = new HashSet<>(
                    storageItemRepository.findItemIdsByMemberEmail(member.getEmail()));

            List<RecipeDto.MissingIngredientDto> missing = recipe.getRecipeIngredients().stream()
                    .filter(ing -> ing.getItem() != null && !myItemIds.contains(ing.getItem().getId()))
                    .map(ing -> new RecipeDto.MissingIngredientDto(
                            ing.getItem().getName(),
                            ing.getQuantity()
                    ))
                    .collect(Collectors.toList());
            dto.setMissingIngredients(missing);
        }

        return dto;
    }

    // 관리자용 PENDING 레시피 목록 조회
    public List<AdminRecipeDto> getPendingRecipes() {
        return recipeRepository.findByApprovalStatus(ApprovalStatus.PENDING)
                .stream()
                .map(r -> new AdminRecipeDto(
                        r.getId(),
                        r.getTitle(),
                        r.getCategory().getDescription(),
                        r.getCookingTime(),
                        r.getDescription(),
                        r.getMember().getName(),
                        r.getMember().getEmail(),
                        r.getRecipeIngredients().stream()
                                .filter(ing -> ing.isRequired())
                                .map(ing -> new RecipeDto.MustIngredientDto(
                                        ing.getItem() != null ? ing.getItem().getName() : "",
                                        ing.getQuantity() != null ? ing.getQuantity() : 0  // quantity 추가
                                ))
                                .collect(Collectors.toList()),
                        r.getRecipeIngredients().stream()
                                .filter(ing -> !ing.isRequired())
                                .map(ing -> new RecipeDto.SelectIngredientDto(
                                        ing.getItem() != null ? ing.getItem().getName() : "",
                                        ing.getQuantity() != null ? ing.getQuantity() : 0
                                ))
                                .collect(Collectors.toList()),
                        r.getUpdatedAt() != null ? r.getUpdatedAt().toLocalDate().toString() : "",
                        r.getImage(),
                        r.getCookingMethod()
                )).collect(Collectors.toList());
    }

    // 관리자용 레시피 단건 조회
    public AdminRecipeDto getRecipeById(Long id) {
        Recipe r = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        return new AdminRecipeDto(
                r.getId(),
                r.getTitle(),
                r.getCategory().getDescription(),
                r.getCookingTime(),
                r.getDescription(),
                r.getMember().getName(),
                r.getMember().getEmail(),
                r.getRecipeIngredients().stream()
                        .filter(ing -> ing.isRequired())
                        .map(ing -> new RecipeDto.MustIngredientDto(
                                ing.getItem() != null ? ing.getItem().getName() : "",
                                ing.getQuantity() != null ? ing.getQuantity() : 0  // quantity 추가
                        ))
                        .collect(Collectors.toList()),
                r.getRecipeIngredients().stream()
                        .filter(ing -> !ing.isRequired())
                        .map(ing -> new RecipeDto.SelectIngredientDto(
                                ing.getItem() != null ? ing.getItem().getName() : "",
                                ing.getQuantity() != null ? ing.getQuantity() : 0
                        ))
                        .collect(Collectors.toList()),
                r.getUpdatedAt() != null ? r.getUpdatedAt().toLocalDate().toString() : "",
                r.getImage(),
                r.getCookingMethod()
        );
    }

    // 레시피 승인
    @Transactional
    public void approveRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipe.setApprovalStatus(ApprovalStatus.APPROVED);
    }

    // 레시피 거절
    @Transactional
    public void rejectRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipe.setApprovalStatus(ApprovalStatus.REJECTED);
    }

    // 레시피 삭제 (본인만 가능)
    @Transactional
    public void deleteRecipe(Long id, String email) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        if (!recipe.getMember().getEmail().equals(email)) {
            throw new RuntimeException("본인이 등록한 레시피만 삭제할 수 있습니다.");
        }

        recipeRepository.delete(recipe);
    }

    // 관리자용 레시피 삭제 (권한 체크 없이 삭제)
    @Transactional
    public void deleteRecipeByAdmin(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipeRepository.delete(recipe);
    }
}