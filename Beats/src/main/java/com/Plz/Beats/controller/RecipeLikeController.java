package com.Plz.Beats.controller;

import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.service.RecipeLikeService;
import com.Plz.Beats.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final S3Service s3Service;

    // GET /api/mypage/like
    @GetMapping("/mypage/like")
    public ResponseEntity<List<RecipeDto>> getLikedRecipes(Principal principal) {
        return ResponseEntity.ok(recipeLikeService.getLikedRecipes(principal.getName()));
    }

    // POST /api/mypage/{id}/like
    @PostMapping("/mypage/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleHeart(
            @PathVariable Long id, Principal principal) {
        boolean hearted = recipeLikeService.toggleLike(principal.getName(), id);
        return ResponseEntity.ok(Map.of("hearted", hearted));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(
            @RequestBody java.util.Map<String, String> body,
            Principal principal) {
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        try {
            String imageUrl = s3Service.uploadBase64(body.get("image"));
            return ResponseEntity.ok(imageUrl);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("이미지 업로드 실패");
        }
    }

}