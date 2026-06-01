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

    // GET /api/mypage/like
    @GetMapping("/mypage/like")
    public ResponseEntity<List<RecipeLikeDto>> getLikedRecipes(Principal principal) {
        return ResponseEntity.ok(recipeLikeService.getLikedRecipes(principal.getName()));
    }

    // POST /api/mypage/{id}/like
    @PostMapping("/mypage/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleHeart(
            @PathVariable Long id, Principal principal) {
        boolean hearted = recipeLikeService.toggleLike(principal.getName(), id); // ✅ 변수명 수정
        return ResponseEntity.ok(Map.of("hearted", hearted));                    // ✅
    }
}