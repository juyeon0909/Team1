package com.Plz.Beats.service;

import com.Plz.Beats.constant.ApprovalStatus;
import com.Plz.Beats.constant.Category;
import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.RecipeIngredient;
import com.Plz.Beats.entity.Item;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.RecipeRepository;
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

    /**
     * 레시피 등록 (DTO -> Entity 변환 저장)
     */
    @Transactional
    public RecipeDto createRecipe(RecipeDto dto, String username) {
        // 1. 현재 로그인한 회원 조회
        Member member = memberRepository.findByEmail(username);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }

        // 2. Recipe 엔티티 생성 및 데이터 매핑
        Recipe recipe = new Recipe();
        recipe.setMember(member);
        recipe.setTitle(dto.getTitle());
        recipe.setDishName(dto.getDishName() != null ? dto.getDishName() : dto.getTitle());
        recipe.setImage(dto.getImage() != null ? dto.getImage() : "default_recipe.png");
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

        // 3. 자식 테이블 재료 엔티티 매핑 연동 (💡 중복 구조 완전 해결)
        if (dto.getMustIngredients() != null) {
            for (RecipeDto.MustIngredientDto ingDto : dto.getMustIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();

                // DB에서 해당 이름의 재료 아이템을 검색
                Item item = itemRepository.findByName(ingDto.getName())
                        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 재료 아이템입니다: " + ingDto.getName()));

                ingredient.setItem(item);
                ingredient.setQuantity(ingDto.getQuantity());
                ingredient.setUnit(""); // 필요한 경우 파싱해서 단위 기입 가능
                ingredient.setRequired(true);
                ingredient.setRecipe(recipe);

                // Recipe 엔티티의 리스트에 추가 (CascadeType.ALL에 의해 같이 저장됨)
                recipe.getRecipeIngredients().add(ingredient);
            }
        }

        // 4. 최종 저장 및 ID 반환
        Recipe savedRecipe = recipeRepository.save(recipe);
        dto.setId(savedRecipe.getId());
        return dto;
    }

    /**
     * 전체 레시피 목록 조회 (Entity -> DTO 변환)
     */
    public List<RecipeDto> getRecipes(String username) {
        List<Recipe> recipes = recipeRepository.findAll();

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

            // 조회할 때 Item 엔티티 내부의 재료 명칭을 꺼내와 DTO 리스트에 결합
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
}