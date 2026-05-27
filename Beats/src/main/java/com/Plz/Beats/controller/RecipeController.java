package com.Plz.Beats.controller;

import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recipeMain")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class RecipeController {

    private final RecipeService recipeService;

    // 1. 메인 목록 피드 데이터 받아오기
    @GetMapping
    public ResponseEntity<?> getAllRecipes(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        List<RecipeDto> list = recipeService.getRecipes(principal.getName());
        return ResponseEntity.ok(list);
    }

    // 2. RecipeRegister.tsx 가 요청하는 등록 API
    @PostMapping("/register")
    public ResponseEntity<?> registerRecipe(@RequestBody RecipeDto recipeDto, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 세션이 유효하지 않습니다.");
        }
        RecipeDto saved = recipeService.createRecipe(recipeDto, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 3. RecipeEdit.tsx 가 저장할 때 요청하는 수정 API
    @PostMapping("/edit")
    public ResponseEntity<?> requestEditRecipe(@RequestBody RecipeDto recipeDto, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 세션이 유효하지 않습니다.");
        }
        // 수정 메커니즘도 기본적으로 동일 포맷팅 변환 후 저장 처리 위임
        RecipeDto saved = recipeService.createRecipe(recipeDto, principal.getName());
        return ResponseEntity.ok(saved);
    }
}