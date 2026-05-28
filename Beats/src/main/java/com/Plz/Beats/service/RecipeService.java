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
     * 레시피 등록 및 수정
     */
    @Transactional
    public RecipeDto createRecipe(RecipeDto dto, String username) {
        // 비로그인 상태 가로채기 방어
        if ("GUEST".equals(username) || username == null) {
            throw new IllegalArgumentException("레시피 등록 및 수정은 로그인 후 이용 가능합니다.");
        }

        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

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

        // 자식 테이블(RecipeIngredient) 연동 매핑
        if (dto.getMustIngredients() != null) {
            for (RecipeDto.MustIngredientDto ingDto : dto.getMustIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();

                // 💡 [핵심 변경 포인트]: DB에 유저가 입력한 재료가 없을 경우의 유연한 처리
                // 사용자가 직접 타이핑하여 없는 재료를 입력하더라도 서버가 터지지 않고 즉석에서 신규 Item을 생성해 영속화합니다.
                Item item = itemRepository.findByName(ingDto.getName().trim())
                        .orElseGet(() -> {
                            Item newItem = new Item();
                            newItem.setName(ingDto.getName().trim());
                            // 만약 Item 엔티티에 다른 필수 필드(ex: category 등)가 있다면 여기에 기본값 세팅이 필요합니다.
                            return itemRepository.save(newItem);
                        });

                ingredient.setItem(item);
                ingredient.setQuantity(ingDto.getQuantity());
                ingredient.setUnit("");

                // 엔티티의 boolean isRequired 필드에 대응하는 롬복 관례 세터
                ingredient.setRequired(true);

                ingredient.setRecipe(recipe);
                recipe.getRecipeIngredients().add(ingredient);
            }
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        dto.setId(savedRecipe.getId());
        return dto;
    }

    /**
     * 전체 레시피 목록 조회 (username이 "GUEST"여도 정상 전체 조회)
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

    // 관리자용 PENDING 레시피 목록
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

    // 승인
    @Transactional
    public void approveRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipe.setApprovalStatus(ApprovalStatus.APPROVED);
    }

    // 거절
    @Transactional
    public void rejectRecipe(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("레시피를 찾을 수 없습니다."));
        recipe.setApprovalStatus(ApprovalStatus.REJECTED);
    }
}
