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
    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProduct(@RequestParam("name") String name) {
        // 1. 서비스단에서 이름(name)을 기반으로 디비에서 1,137개 중 일치하는 식재료 목록을 긁어옵니다.
        List<ProductDto> searchResults = productService.searchItemsByName(name);

        // 2. 리액트가 목말라하던 200 OK 사인과 함께 데이터를 던져줍니다.
        return ResponseEntity.ok(searchResults);
    }

    @PostMapping("/delete/{id}")
    public ResponseEntity<String> deleteStorage(@PathVariable("id") Long id) {

        // 🟢 서비스에 이미 만들어져 있을 아이템 삭제 메서드를 호출합니다.
        productService.deleteStorageItem(id);

        return ResponseEntity.ok("식재료가 데이터베이스에서 영구 삭제되었습니다.");
    }

}