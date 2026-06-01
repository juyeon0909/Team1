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
@RequestMapping("/api/mypage") // 🟢 메인(/api/recipeMain)과 확실하게 주소를 분리!
@RequiredArgsConstructor
public class MyPageRecipeController {

    private final RecipeService recipeService;

    // 🟢 내 레시피 목록만 조회하는 전용 엔드포인트
    @GetMapping("/recipe")
    public ResponseEntity<?> getMyRecipes(Principal principal) {
        // 토큰이 없거나 로그인 안 된 경우 401 컷
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        // 로그인한 사람의 이메일로 '내 레시피'만 조회
        List<RecipeDto> list = recipeService.getMyRecipes(principal.getName());
        return ResponseEntity.ok(list);
    }

    // 🟢 내 레시피 삭제
    @DeleteMapping("/recipe/{id}")
    public ResponseEntity<?> deleteMyRecipe(@PathVariable Long id, Principal principal) {
        if (principal == null || "anonymousUser".equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        recipeService.deleteRecipe(id, principal.getName());
        return ResponseEntity.ok("삭제 완료");
    }

}