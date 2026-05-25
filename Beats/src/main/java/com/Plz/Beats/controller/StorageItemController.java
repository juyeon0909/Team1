package com.Plz.Beats.controller;

import com.Plz.Beats.dto.StorageItemDto;
import com.Plz.Beats.dto.StorageItemRegisterDto;
import com.Plz.Beats.service.StorageItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/product")
public class StorageItemController {

    private final StorageItemService storageItemService;

    // 유통기한 임박 순 상위 4개 (메인 페이지)
    @GetMapping("/expiring/{memberId}")
    public ResponseEntity<List<StorageItemDto>> getExpiringItems(@PathVariable Long memberId) {
        return ResponseEntity.ok(storageItemService.getTop4ExpiringItems(memberId));
    }

    // 사용자 전체 재료 목록 (보관함 페이지)
    @GetMapping("/list/{memberId}")
    public ResponseEntity<List<StorageItemDto>> getAllItems(@PathVariable Long memberId) {
        return ResponseEntity.ok(storageItemService.getAllItems(memberId));
    }

    // 재료 등록
    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody StorageItemRegisterDto dto) {
        storageItemService.register(dto);
        return ResponseEntity.ok().build();
    }
}
