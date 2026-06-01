package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDto {
    private Long id;
    private String title;           // 레시피 제목
    private String dishName;        // 💡 요리명 (엔티티 필수 필드 반영)
    private String category;        // 카테고리 (문자열로 받아 서비스에서 Enum 전환)
    private int cookingTime;        // 조리 시간
    private String description;     // 간단 소개
    private String image;           // 💡 요리 사진 URL 또는 파일 경로 (엔티티 필수 필드 반영)
    private List<String> steps;     // 조리 단계 리스트 (엔티티의 cookingMethod와 매핑)
    private List<MustIngredientDto> mustIngredients; // 필수 재료 리스트
    private List<SelectIngredientDto> selectIngredients; // 선택 재료 리스트
    private long likeCount;
    private long scrapCount;
    private boolean hearted;
    private boolean scrapped;


    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MustIngredientDto {
        private String name;
        private String quantity;
    }

    public static class SelectIngredientDto{
        private String name;
        private String quantity;
    }


}
