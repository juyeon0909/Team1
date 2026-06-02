package com.Plz.Beats.controller;

import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.service.ScrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ScrapController {

    private final ScrapService scrapService;

    @GetMapping("/recipeMain/clip")
    public ResponseEntity<List<RecipeDto>> getScrappedRecipes(Principal principal) {
        return ResponseEntity.ok(scrapService.getScrappedRecipes(principal.getName()));
    }

    @PostMapping("/recipeMain/{id}/clip")
    public ResponseEntity<Map<String, Object>> toggleScrap(
            @PathVariable Long id, Principal principal) {
        boolean scrapped = scrapService.toggleScrap(principal.getName(), id);
        return ResponseEntity.ok(Map.of("scrapped", scrapped));
    }

}