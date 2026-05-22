//package com.Plz.Beats.service;
//
//import com.Plz.Beats.entity.Product;
//import com.Plz.Beats.repository.ProductRepository;
//
//import lombok.RequiredArgsConstructor;
//
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//@Service
//@RequiredArgsConstructor
//public class ProductService {
//
//    private final S3Service s3Service;
//    private final ProductRepository repository;
//
//    public Product saveImage(MultipartFile file)
//            throws Exception {
//
//        // S3 업로드
//        String imageUrl = s3Service.uploadFile(file);
//
//        // DB 저장
//        Product image =
//                Product.builder()
//                        .imageName(file.getOriginalFilename())
//                        .imageUrl(imageUrl)
//                        .build();
//
//        return repository.save(image);
//    }
//}

package com.Plz.Beats.service;

import com.Plz.Beats.constant.Storagetype;
import com.Plz.Beats.dto.ProductDto;
import com.Plz.Beats.entity.Storage_item;
import com.Plz.Beats.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 💡 기본적으로 읽기 전용 트랜잭션을 걸어 조회 성능을 최적화합니다.
public class ProductService {

    private final ProductRepository repository;

//    public List<ProductDto> getAllStorageItems() {
//        return repository.findAll().stream()
//                .map(ProductDto::fromEntity)
//                .collect(Collectors.toList());
//    }
    @PersistenceContext
    private EntityManager entityManager;
    // 컨트롤러에서 5L을 넘겨받을 수 있도록 매개변수(Long memberId)를 추가합니다.
    @Transactional
    public List<ProductDto> getAllStorageItems() {
        return repository.findAll().stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }
    /**
     * 2. [상세] 특정 재료 1개 상세 조회 (FridgeEdit 폼 로딩용)
     * 수정을 위해 클릭한 재료의 고유 ID(storage_item_id)를 기반으로 데이터를 찾아 DTO로 반환합니다.
     */
    public ProductDto getStorageItemById(Long id) {
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료를 찾을 수 없습니다. ID: " + id));
        return ProductDto.fromEntity(item);
    }

    /**
     * 3. [수정] 재료 정보 변경 반영 (FridgeEdit 저장 버튼 클릭 시)
     * 리액트 인터셉터가 실어다 준 수정 데이터(DTO)를 받아 기존 DB 데이터를 교체합니다.
     */
    @Transactional // 💡 쓰기(Update) 작업이므로 트랜잭션을 확실하게 켜줍니다.
    public void updateStorageItem(Long id, ProductDto dto) {
        // 영속성 컨텍스트에서 기존 데이터를 조회해 옵니다.
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료가 존재하지 않습니다. ID: " + id));

        // 💡 기존 엔티티의 Setter를 깨워 리액트에서 넘어온 새로운 값으로 덮어씁니다.
        item.setItemname(dto.getName());
        item.setQuantity(dto.getQuantity()); // 리액트에서 정수로 파싱되어 온 수량 적용
        item.setExpirationdate(dto.getExpiry());

        // 💡 [Enum 치환 필터] 리액트의 'room' 문자열을 백엔드의 'ROOM_TEMP' 상수로 조율합니다.
        if (dto.getType() != null) {
            String typeUpper = dto.getType().toUpperCase();

            try {
                if (typeUpper.equals("ROOM")) {
                    item.setStoragetype(Storagetype.ROOM_TEMP); // 👈 확인하신 ROOM_TEMP 정확히 안착!
                } else {
                    item.setStoragetype(Storagetype.valueOf(typeUpper)); // FROZEN, REFRIGERATED 매핑
                }
            } catch (IllegalArgumentException e) {
                item.setStoragetype(Storagetype.REFRIGERATED); // 에러 발생 시 안전하게 냉장으로 방어
            }
        }

        // 💡 JPA의 영속성 컨텍스트 더티 체킹(Dirty Checking) 기술 덕분에
        // 별도로 repository.save()를 치지 않아도 이 메서드가 끝날 때 자동으로 MySQL에 UPDATE 쿼리가 동기화됩니다.
    }
}