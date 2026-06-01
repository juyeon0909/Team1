package com.Plz.Beats.controller;

import com.Plz.Beats.dto.ScrapDto;
import com.Plz.Beats.service.S3Service;
import com.Plz.Beats.service.ScrapService;
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
public class ScrapController {

    private final ScrapService scrapService;



    @GetMapping("/recipeMain/clip")
    public ResponseEntity<List<ScrapDto>> getScrappedRecipes(Principal principal) {
        return ResponseEntity.ok(scrapService.getScrappedRecipes(principal.getName()));
    }

    @PostMapping("/recipeMain/{id}/clip")  // ✅ /clip 추가
    public ResponseEntity<Map<String, Object>> toggleScrap(
            @PathVariable Long id, Principal principal) {
        boolean scrapped = scrapService.toggleScrap(principal.getName(), id);
        return ResponseEntity.ok(Map.of("scrapped", scrapped));
    }


    }



