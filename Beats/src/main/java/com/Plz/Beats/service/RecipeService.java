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


    // 레시피 등록 및 수정
    @Transactional  //현재 기본이 읽기 전용인데 이 어노테이션을 쓰면 쓰기 트렌젝션으로 변경됨.
    public RecipeDto createRecipe(RecipeDto dto, String username) {
        // 비로그인 상태 가로채기 방어
        if ("GUEST".equals(username) || username == null) {
            throw new IllegalArgumentException("레시피 등록 및 수정은 로그인 후 이용 가능합니다.");
        }

        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Recipe recipe = new Recipe(); //새 레시피 엔티티 생성
        recipe.setMember(member); //작성자 연결
        recipe.setTitle(dto.getTitle()); //제목 설정
        // 요리명이 없으면 제목으로 대체 (null 방지)
        recipe.setDishName(dto.getDishName() != null ? dto.getDishName() : dto.getTitle());


        // 여기가 이미지 생성. 기본 이미지 설정(default.png)
        recipe.setImage(dto.getImage() != null && !dto.getImage().isEmpty()
                ? dto.getImage()
                : "https://in-my-fridge-image-bucket.s3.ap-northeast-2.amazonaws.com/default.png");


        recipe.setCategory(Category.valueOf(dto.getCategory())); // 문자열 -> enum
        recipe.setCookingTime(dto.getCookingTime()); //조리 시간
        recipe.setDescription(dto.getDescription()); //설명

        // 등록 시 항상 PENDING으로 저장 — 관리자 승인 전까지 목록에 노출되지 않음
        recipe.setApprovalStatus(ApprovalStatus.PENDING);
        recipe.setUpdatedAt(LocalDateTime.now()); //수정 시각 기록

        // 조리 단계. 리스트를 줄바꿈으로 합쳐서 한 컬럼에 저장.
        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            recipe.setCookingMethod(String.join("\n", dto.getSteps()));
        } else {
            recipe.setCookingMethod("1. 맛있게 요리합니다.");
        }

        // 자식 테이블(RecipeIngredient) 연동 매핑
        // 재료 목록 처리
        if (dto.getMustIngredients() != null) {
            for (RecipeDto.MustIngredientDto ingDto : dto.getMustIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();

                //  DB에 유저가 입력한 재료가 없을 경우 대비
                // db에 그 재료가 이미 있으면 가져오고
                // 없으면 새로 만들어 저장
                Item item = itemRepository.findByName(ingDto.getName().trim())
                        .orElseGet(() -> {
                            Item newItem = new Item();
                            newItem.setName(ingDto.getName().trim());
                            return itemRepository.save(newItem);
                        });

                ingredient.setItem(item); //재료 연결
                ingredient.setQuantity(ingDto.getQuantity()); //수량
                ingredient.setUnit("g"); //단위 (현재는 안쓰임.)

                // 엔티티의 boolean isRequired 필드에 대응하는 롬복 관례 세터
                // 필수 재료 여부 = true
                ingredient.setRequired(true);

                // 부모 레시피 연결
                ingredient.setRecipe(recipe);
                //레시피에 재료 추가
                recipe.getRecipeIngredients().add(ingredient);
            }
        }

        // db 저장. 재료도 cascade로 함께 저장됨.
        Recipe savedRecipe = recipeRepository.save(recipe);
        dto.setId(savedRecipe.getId()); //생성된 id를 dto에 반영
        return dto;
    }

    // 승인된 (approved) 레시피만 조회해서 dto로 변환.
    // 좋아요/ 스크랩 개수와 현재 로그인 회원의 하트/스크랩 여부도 여기서 반환함.
    public List<RecipeDto> getRecipes(String username) {
        // findAll() → findByApprovalStatus(APPROVED)
        // 기존 findAll()은 PENDING 레시피도 노출시키는 문제가 있었음
        List<Recipe> recipes = recipeRepository.findByApprovalStatus(ApprovalStatus.APPROVED);

        Member member = null;
        if (!"GUEST".equals(username)) {
            member = memberRepository.findByEmail(username).orElse(null);
        }
        final Member currentMember = member;

        return recipes.stream().map(recipe -> {
            RecipeDto dto = new RecipeDto();
            dto.setId(recipe.getId());
            dto.setTitle(recipe.getTitle());
            dto.setDishName(recipe.getDishName());
            dto.setCategory(recipe.getCategory().name());
            dto.setCookingTime(recipe.getCookingTime());
            dto.setDescription(recipe.getDescription());
            dto.setImage(recipe.getImage());

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
        }).collect(Collectors.toList());
    }

    /**
     * 내가 등록한 레시피 목록 조회 (마이페이지용)
     */
    public List<RecipeDto> getMyRecipes(String email) {
        // 1. 이메일로 회원 정보 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 해당 회원이 작성한 레시피만 조회 (RecipeRepository의 findByMember 활용)
        List<Recipe> myRecipes = recipeRepository.findByMember(member);

        // 3. Entity -> DTO 변환 로직 진행
        return myRecipes.stream().map(recipe -> {
            RecipeDto dto = new RecipeDto();
            dto.setId(recipe.getId());
            dto.setTitle(recipe.getTitle());
            dto.setDishName(recipe.getDishName());
            dto.setCategory(recipe.getCategory().name());
            dto.setCookingTime(recipe.getCookingTime());
            dto.setDescription(recipe.getDescription());
            dto.setImage(recipe.getImage());

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

            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * 관리자용 PENDING 레시피 목록 조회
     */
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
                                .map(ing -> ing.getItem() != null ? ing.getItem().getName() : "")
                                .collect(Collectors.toList()),
                        r.getUpdatedAt() != null ? r.getUpdatedAt().toLocalDate().toString() : ""
                )).collect(Collectors.toList());
    }


    /**
     * 레시피 승인
     */
    @Transactional
    public void approveRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipe.setApprovalStatus(ApprovalStatus.APPROVED);
    }

    /**
     * 레시피 거절
     */
    @Transactional
    public void rejectRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipe.setApprovalStatus(ApprovalStatus.REJECTED);
    }

    /**
     * 레시피 삭제 (본인만 가능)
     */
    @Transactional
    public void deleteRecipe(Long id, String email) {
        System.out.println("=== deleteRecipe 호출됨 id=" + id + " email=" + email);

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));

        System.out.println("=== 레시피 작성자=" + recipe.getMember().getEmail());

        if (!recipe.getMember().getEmail().equals(email)) {
            System.out.println("=== 본인 아님!");
            throw new RuntimeException("본인이 등록한 레시피만 삭제할 수 있습니다.");
        }

        recipeRepository.delete(recipe);
        System.out.println("=== 삭제 완료");
    }
}
