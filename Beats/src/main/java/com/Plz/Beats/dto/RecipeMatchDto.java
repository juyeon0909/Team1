// dto/RecipeMatchDto.java
package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RecipeMatchDto {
    private Long id;
    private String title;
    private String dishName;
    private String category;
    private int cookingTime;
    private String description;
    private String image;

    private int totalIngredients;   // 레시피 전체 재료 수
    private int matchedIngredients; // 보유한 재료 수
    private int matchRate;          // 매칭률(%)
}