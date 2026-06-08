package com.Plz.Beats.controller;

import com.Plz.Beats.dto.AdminRecipeDto;
import com.Plz.Beats.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/recipes")
@RequiredArgsConstructor
public class AdminRecipeController {

    private final RecipeService recipeService;

    @GetMapping("/pending")
    public ResponseEntity<List<AdminRecipeDto>> getPending() {
        return ResponseEntity.ok(recipeService.getPendingRecipes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminRecipeDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getRecipeById(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approve(@PathVariable Long id) {
        recipeService.approveRecipe(id);
        return ResponseEntity.ok("승인 완료");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> reject(@PathVariable Long id) {
        recipeService.rejectRecipe(id);
        return ResponseEntity.ok("거절 완료");
    }
}