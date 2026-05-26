package com.Plz.Beats.controller;

import com.Plz.Beats.dto.ProductDto;
import com.Plz.Beats.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product") // 💡 리액트 axiosInstance의 baseURL 뒤에 붙을 공통 주소입니다.
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/list")
    public ResponseEntity<List<ProductDto>> getStorageList() {
        // 1. 우선 DB에 있는 모든 냉장고 아이템을 다 가져옵니다.
        List<ProductDto> allList = productService.getAllStorageItems();

        return ResponseEntity.ok(allList); // 200 OK 상태코드와 함께 안전하게 데이터를 반환합니다.
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<ProductDto> getStorageDetail(@PathVariable("id") Long id) {
        ProductDto dto = productService.getStorageItemById(id);
        return ResponseEntity.ok(dto);
    }


    @PostMapping("/update/{id}")
    public ResponseEntity<String> updateStorage(
            @PathVariable("id") Long id,
            @RequestBody ProductDto productDto) {

        productService.updateStorageItem(id, productDto);
        return ResponseEntity.ok("식재료 정보가 성공적으로 변경되었습니다.");

    }

}