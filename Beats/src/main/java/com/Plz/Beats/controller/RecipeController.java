package com.Plz.Beats.controller;

import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.service.RecipeService;
import com.Plz.Beats.storage.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recipeMain")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final ImageStorageService imageStorageService;

    // 1. 메인 목록 피드 데이터 받아오기 (비로그인/로그인 전체 허용)
    @GetMapping
    public ResponseEntity<?> getAllRecipes(Principal principal) {
        // 💡 시큐리티 익명 사용자 관례("anonymousUser")까지 완벽하게 파악하여 "GUEST"로 통합 처리
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
}

