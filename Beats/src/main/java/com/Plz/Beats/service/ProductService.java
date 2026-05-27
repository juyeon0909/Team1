package com.Plz.Beats.service;

import com.Plz.Beats.constant.Storagetype;
import com.Plz.Beats.dto.ProductDto;
import com.Plz.Beats.entity.Storage_item;
import com.Plz.Beats.repository.ItemRepository;
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
    private final ItemRepository itemRepository;

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
    @Transactional //
    public void updateStorageItem(Long id, ProductDto dto) {
        // 영속성 컨텍스트에서 기존 데이터를 조회해 옵니다.
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료가 존재하지 않습니다. ID: " + id));

        com.Plz.Beats.entity.Item realItem = itemRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 식재료 항목입니다. ID: " + dto.getId()));
        // 💡
        item.setItem(realItem);
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
    }
    @Transactional // 👈 찐중요: DB 데이터를 '삭제'하는 쓰기 작업이므로 읽기 전용을 깨고 트랜잭션을 걸어줍니다!
    public void deleteStorageItem(Long id) {
        // 1. 혹시 이미 지워졌거나 없는 ID인지 먼저 확인하는 방어 코드
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료가 존재하지 않습니다. ID: " + id));

        // 2. 존재가 확인되면 JPA 리포지토리를 통해 DB에서 완전히 날려버립니다.
        repository.delete(item);
    }

    public List<ProductDto> searchItemsByName(String name) {
        // itemRepository를 통해 이름에 검색어가 포함된 식재료들을 디비에서 찾습니다.
        return itemRepository.findByNameContaining(name).stream()
                .map(item -> {
                    ProductDto dto = new ProductDto();
                    dto.setId(item.getId());
                    dto.setName(item.getName());
                    dto.setCategory(item.getCategory());
                    // 필요 시 단우(itemUnit)도 DTO에 필드가 있다면 세팅해 줍니다.
                    if (item.getFridgeStatus() != null) {
                        dto.setType(item.getFridgeStatus().toLowerCase()); // 예: "frozen", "refrigerated"
                    } else {
                        dto.setType("refrigerated"); // 기본값 방어
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
}