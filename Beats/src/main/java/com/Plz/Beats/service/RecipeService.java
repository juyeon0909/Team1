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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
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


    /**
     * Recipe 엔티티를 RecipeDto로 변환하는 공통 메서드.
     * 메인 목록 / 스크랩 목록 / 좋아요 목록이 모두 이 메서드를 재사용한다.
     *
     * @param recipe        변환할 레시피
     * @param currentMember 현재 로그인 회원 (비로그인이면 null) — hearted/scrapped 판정용
     */
    public RecipeDto toDto(Recipe recipe, Member currentMember) {
        RecipeDto dto = new RecipeDto();
        dto.setId(recipe.getId());
        dto.setTitle(recipe.getTitle());
        dto.setDishName(recipe.getDishName());
        dto.setCategory(recipe.getCategory().name());   // 코드값("RAP") — 한글 변환은 프론트 담당
        dto.setCookingTime(recipe.getCookingTime());     // 숫자
        dto.setDescription(recipe.getDescription());
        dto.setImage(recipe.getImage());
        dto.setAuthor(recipe.getMember().getName());     // 작성자 이름

        if (recipe.getCookingMethod() != null) {
            dto.setSteps(Arrays.asList(recipe.getCookingMethod().split("\n")));
        }

        List<RecipeDto.MustIngredientDto> ingDtos = recipe.getRecipeIngredients().stream()
                .map(ing -> new RecipeDto.MustIngredientDto(
                        ing.getItem() != null ? ing.getItem().getName() : "알 수 없는 재료",
                        ing.getQuantity()
                ))
                .collect(Collectors.toList());
        dto.setMustIngredients(ingDtos);

        dto.setLikeCount(recipeLikeRepository.countByRecipe(recipe));
        dto.setScrapCount(scrapRepository.countByRecipe(recipe));

        if (currentMember != null) {
            dto.setHearted(recipeLikeRepository.findByMemberAndRecipe(currentMember, recipe).isPresent());
            dto.setScrapped(scrapRepository.findByMemberAndRecipe(currentMember, recipe).isPresent());
        } else {
            dto.setHearted(false);
            dto.setScrapped(false);
        }

        return dto;
    }


    // 레시피 등록 및 수정
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

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        // 본인 확인
        if (!recipe.getMember().getEmail().equals(username)) {
            throw new IllegalArgumentException("본인이 등록한 레시피만 수정할 수 있습니다.");
        }

        recipe.setTitle(dto.getTitle());
        recipe.setDishName(dto.getDishName() != null ? dto.getDishName() : dto.getTitle());
        if (dto.getImage() != null && !dto.getImage().isEmpty()) {
            recipe.setImage(dto.getImage());
        }
        recipe.setCategory(Category.valueOf(dto.getCategory()));
        recipe.setCookingTime(dto.getCookingTime());
        recipe.setDescription(dto.getDescription());
        recipe.setApprovalStatus(ApprovalStatus.PENDING); // 수정하면 다시 승인 대기
        recipe.setUpdatedAt(LocalDateTime.now());

        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            recipe.setCookingMethod(String.join("\n", dto.getSteps()));
        }

        // 기존 재료 전부 비우고 새로 채움 (orphanRemoval = true 라 DB에서도 삭제됨)
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

        dto.setId(recipe.getId());
        return dto;
    }

    // 승인된 레시피 목록 조회
    public List<RecipeDto> getRecipes(String username) {
        List<Recipe> recipes = recipeRepository.findByApprovalStatus(ApprovalStatus.APPROVED);

        Member member = null;
        if (!"GUEST".equals(username)) {
            member = memberRepository.findByEmail(username).orElse(null);
        }
        final Member currentMember = member;

        return recipes.stream()
                .map(recipe -> toDto(recipe, currentMember))
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
        return toDto(recipe, member);
    }

    // 관리자용 PENDING 레시피 목록 조회
    public List<AdminRecipeDto> getPendingRecipes() {
        return recipeRepository.findByApprovalStatus(ApprovalStatus.PENDING)
                .stream().map(r -> new AdminRecipeDto(
                        r.getId(),
                        r.getTitle(),
                        r.getCategory().getDescription(),
                        r.getCookingTime(),
                        r.getDescription(),
                        r.getMember().getName(),
                        r.getMember().getEmail(),
                        r.getRecipeIngredients().stream()
                                .map(ing -> new RecipeDto.MustIngredientDto(
                                        ing.getItem() != null ? ing.getItem().getName() : "",
                                        ing.getQuantity() != null ? ing.getQuantity() : 0  // quantity 추가
                                ))
                                .collect(Collectors.toList()),
                        null,
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
                        .map(ing -> new RecipeDto.MustIngredientDto(
                                ing.getItem() != null ? ing.getItem().getName() : "",
                                ing.getQuantity() != null ? ing.getQuantity() : 0  // quantity 추가
                        ))
                        .collect(Collectors.toList()),
                null,
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
}