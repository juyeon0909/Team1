package com.Plz.Beats.service;

import com.Plz.Beats.constant.ApprovalStatus;
import com.Plz.Beats.constant.Category;
import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.RecipeIngredient; // 재료 엔티티가 있다고 가정
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.RecipeRepository;
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

    /**
     * 레시피 등록 (DTO -> Entity 변환 저장)
     */
    @Transactional
    public RecipeDto createRecipe(RecipeDto dto, String username) {
        // 1. 현재 로그인한 회원 조회
        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        // 2. Recipe 엔티티 생성 및 데이터 매핑
        Recipe recipe = new Recipe();
        recipe.setMember(member);
        recipe.setTitle(dto.getTitle());

        // dishName 유효성 방어 (없으면 title 대체)
        recipe.setDishName(dto.getDishName() != null ? dto.getDishName() : dto.getTitle());

        // 프론트엔드 임시 깡통 이미지 방어 규칙
        recipe.setImage(dto.getImage() != null ? dto.getImage() : "default_recipe.png");

        // String -> Enum 카테고리 변환 처리
        recipe.setCategory(Category.valueOf(dto.getCategory()));
        recipe.setCookingTime(dto.getCookingTime());
        recipe.setDescription(dto.getDescription());
        recipe.setApprovalStatus(ApprovalStatus.PENDING); // 등록 시 기본 대기 상태 가정
        recipe.setUpdatedAt(LocalDateTime.now());

        // List<String> 조리 단계를 단일 String 문자열(\n 구분)로 결합하여 덩어리로 저장
        if (dto.getSteps() != null && !dto.getSteps().isEmpty()) {
            String combinedMethod = String.join("\n", dto.getSteps());
            recipe.setCookingMethod(combinedMethod);
        } else {
            recipe.setCookingMethod("1. 맛있게 요리합니다."); // 필수값 기본 처리
        }

        // 3. 자식 테이블 재료 엔티티 매핑 연동 (CascadeType.ALL 작동)
        if (dto.getMustIngredients() != null) {
            for (RecipeDto.MustIngredientDto ingDto : dto.getMustIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                ingredient.setName(ingDto.getName());
                ingredient.setQuantity(ingDto.getQuantity());
                ingredient.setRecipe(recipe); // 양방향 연관관계 편의 설정
                recipe.getRecipeIngredients().add(ingredient);
            }
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        dto.setId(savedRecipe.getId());
        return dto;
    }

    /**
     * 전체 레시피 목록 조회 (Entity -> DTO 변환)
     */
    public List<RecipeDto> getRecipes(String username) {
        List<Recipe> recipes = recipeRepository.findAll(); // 추후 상황에 부합하는 조회 쿼리 교체 가능

        return recipes.stream().map(recipe -> {
            RecipeDto dto = new RecipeDto();
            dto.setId(recipe.getId());
            dto.setTitle(recipe.getTitle());
            dto.setDishName(recipe.getDishName());
            dto.setCategory(recipe.getCategory().name()); // Enum -> String
            dto.setCookingTime(recipe.getCookingTime());
            dto.setDescription(recipe.getDescription());
            dto.setImage(recipe.getImage());

            // DB 줄글 데이터를 다시 List<String> 배열로 쪼개어 프론트엔드로 전달
            if (recipe.getCookingMethod() != null) {
                dto.setSteps(Arrays.asList(recipe.getCookingMethod().split("\n")));
            }

            // 하위 재료 엔티티 데이터를 DTO 규격 내부 리스트로 변환
            List<RecipeDto.MustIngredientDto> ingDtos = recipe.getRecipeIngredients().stream()
                    .map(ing -> new RecipeDto.MustIngredientDto(ing.getName(), ing.getQuantity()))
                    .collect(Collectors.toList());
            dto.setMustIngredients(ingDtos);

            return dto;
        }).collect(Collectors.toList());
    }
}