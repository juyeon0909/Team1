package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.List;

@Getter
@AllArgsConstructor
public class AdminRecipeDto {
    private Long id;
    private String title;
    private String category;
    private Integer cookingTime;
    private String description;
    private String authorName;
    private String authorEmail;
    private List<String> ingredients;
    private String registeredAt;
}