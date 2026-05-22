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

    /**
     * 1. 📋 [GET] 냉장고 전체 재료 리스트 조회
     * 리액트 호출: axiosInstance.get('/product/list')
     * * @GetMapping("/list")를 붙여서 주소창에 '/api/product/list'로 신호가 들어오면 이 메서드가 깨어납니다.
     * 서비스단에 명령을 내려 MySQL에서 가공된 깔끔한 DTO 가방 리스트를 꺼내와 리액트에 JSON 데이터로 던져줍니다.
     */
    @GetMapping("/list")
    public ResponseEntity<List<ProductDto>> getStorageList() {
        List<ProductDto> list = productService.getAllStorageItems();
        return ResponseEntity.ok(list); // 200 OK 상태코드와 함께 안전하게 데이터를 반환합니다.
    }

    /**
     * 2. 🔍 [GET] 특정 재료 1개의 기존 상세 데이터 조회
     * 리액트 호출: axiosInstance.get(`/product/detail/${id}`)
     * * 주소창 뒤에 붙은 번호(예: /api/product/detail/101)를 자바 변수로 쏙 빼오기 위해
     * @PathVariable 상자를 이용해 Long id 변수에 담습니다.
     * 수정 창(FridgeEdit)이 켜지자마자 기존에 입력되어 있던 재료 명과 유통기한을 채워 넣기 위해 사용됩니다.
     */
    @GetMapping("/detail/{id}")
    public ResponseEntity<ProductDto> getStorageDetail(@PathVariable("id") Long id) {
        ProductDto dto = productService.getStorageItemById(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * 3. ✏️ [PUT] 수정된 재료 정보를 DB에 최종 변경 반영
     * 리액트 호출: axiosInstance.put(`/product/update/${id}`, 데이터)
     * * @RequestBody 어노테이션이 아주 중요합니다!
     * 리액트가 HTTP 바디(우편함 안쪽)에 숨겨서 보낸 복잡한 JSON 수정 텍스트 데이터를
     * 자바가 읽을 수 있도록 ProductDto 가방으로 자동 파싱(조립)해 주는 역할을 합니다.
     */
    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateStorage(
            @PathVariable("id") Long id,
            @RequestBody ProductDto productDto) {

        productService.updateStorageItem(id, productDto);
        return ResponseEntity.ok("식재료 정보가 성공적으로 변경되었습니다.");
    }
}