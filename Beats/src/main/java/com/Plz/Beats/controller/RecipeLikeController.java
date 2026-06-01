package com.Plz.Beats.controller;

import com.Plz.Beats.dto.RecipeLikeDto;
import com.Plz.Beats.service.RecipeLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecipeLikeController {

    private final RecipeLikeService recipeLikeService;

    // GET /api/user/likes
    @GetMapping("/mypage/like")
    public ResponseEntity<List<RecipeLikeDto>> getLikedRecipes(Principal principal) {
        return ResponseEntity.ok(recipeLikeService.getLikedRecipes(principal.getName()));
    }

    // POST /api/recipe/{id}/ like
    @PostMapping("/recipe/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id, Principal principal) {
        boolean liked = recipeLikeService.toggleLike(principal.getName(), id);
        return ResponseEntity.ok(Map.of("liked", liked));
    }
}