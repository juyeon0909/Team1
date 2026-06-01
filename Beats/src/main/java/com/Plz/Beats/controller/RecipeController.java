package com.Plz.Beats.controller;

import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.service.RecipeMatchService;
import com.Plz.Beats.service.RecipeService;
import com.Plz.Beats.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recipeMain")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final S3Service s3Service;
    private final RecipeMatchService recipeMatchService;

    // 1. 메인 목록 피드 데이터 받아오기 (비로그인/로그인 전체 허용)
    @GetMapping
    public ResponseEntity<?> getAllRecipes(Principal principal) {
        String email = "GUEST";
        if (principal != null && !"anonymousUser".equals(principal.getName())) {
            email = principal.getName();
        }

        List<RecipeDto> list = recipeService.getRecipes(email);
        return ResponseEntity.ok(list);
    }

    // 2. 레시피 등록 API (로그인 필수)
    @PostMapping("/register")
    public ResponseEntity<?> registerRecipe(@RequestBody RecipeDto recipeDto, Principal principal) {
        // 💡 비로그인 유저거나 익명 토큰 유저라면 사전에 401 컷
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 세션이 유효하지 않거나 로그인이 필요합니다.");
        }

        RecipeDto saved = recipeService.createRecipe(recipeDto, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 3. 레시피 수정 API (로그인 필수)
    @PostMapping("/edit")
    public ResponseEntity<?> requestEditRecipe(@RequestBody RecipeDto recipeDto, Principal principal) {
        // 💡 비로그인 유저거나 익명 토큰 유저라면 사전에 401 컷
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 세션이 유효하지 않거나 로그인이 필요합니다.");
        }

        RecipeDto saved = recipeService.createRecipe(recipeDto, principal.getName());
        return ResponseEntity.ok(saved);
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

    // 🟢 내가 등록한 마이페이지 레시피 목록 조회 API 추가
    @GetMapping("/mypage/recipe")
    public ResponseEntity<?> getMyPageRecipes(Principal principal) {
        // 비로그인 유저 예외 처리
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요한 서비스입니다.");
        }

        String email = principal.getName();
        // 💡 Service에 내 이메일로 등록된 레시피만 가져오는 메서드 호출
        List<RecipeDto> myRecipes = recipeService.getRecipes(email);
        return ResponseEntity.ok(myRecipes);
    }

    @GetMapping("/match")
    public ResponseEntity<?> getRecipesWithMatch(Principal principal) {
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요한 서비스입니다.");
        }

        String email = principal.getName();
        return ResponseEntity.ok(recipeMatchService.getRecipesWithMatchRate(email));
    }
}
