// service/RecipeMatchService.java
package com.Plz.Beats.service;

import com.Plz.Beats.constant.ApprovalStatus;
import com.Plz.Beats.dto.RecipeMatchDto;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.repository.RecipeIngredientRepository;
import com.Plz.Beats.repository.RecipeRepository;
import com.Plz.Beats.repository.StorageItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RecipeMatchService {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final StorageItemRepository storageItemRepository;

    @Transactional(readOnly = true)
    public List<RecipeMatchDto> getRecipesWithMatchRate(String email) {

        // 1. 사용자 보유 재료 id 집합 (email 기준 한 방 조회)
        Set<Long> myItemIds =
                new HashSet<>(storageItemRepository.findItemIdsByMemberEmail(email));

        // 2. 레시피 목록 (승인된 것만 / 전체로 바꾸려면 recipeRepository.findAll())
        List<Recipe> recipes =
                recipeRepository.findByApprovalStatus(ApprovalStatus.APPROVED);

        // 3. 레시피별 매칭률 계산
        List<RecipeMatchDto> result = new ArrayList<>();
        for (Recipe recipe : recipes) {
            List<Long> recipeItemIds =
                    recipeIngredientRepository.findItemIdsByRecipeId(recipe.getId());

            int total = recipeItemIds.size();
            int matched = 0;
            for (Long itemId : recipeItemIds) {
                if (itemId != null && myItemIds.contains(itemId)) {
                    matched++;
                }
            }

            int rate = (total == 0) ? 0 : (int) Math.round((double) matched / total * 100);

            result.add(new RecipeMatchDto(
                    recipe.getId(),
                    recipe.getTitle(),
                    recipe.getDishName(),
                    recipe.getCategory() != null ? recipe.getCategory().getDescription() : null, // .name() → .getDescription()
                    recipe.getCookingTime() != null ? recipe.getCookingTime() : 0,
                    recipe.getDescription(),
                    recipe.getImage(),
                    total,
                    matched,
                    rate
            ));
        }

        // 4. 매칭률 높은 순 정렬
        result.sort(Comparator.comparingInt(RecipeMatchDto::getMatchRate).reversed());

        return result;
    }
}