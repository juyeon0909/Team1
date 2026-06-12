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
import com.Plz.Beats.entity.Item;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository repository;
    private final ItemRepository itemRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private Item findMasterItemOrThrow(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 마스터 식재료입니다. ID: " + id));
    }

    // 마스터 식재료 보관 타입
    private void parseAndSetFridgeStatus(Item item, String type) {
        if (type != null) {
            String typeUpper = type.toUpperCase();
            if (typeUpper.contains("FROZEN") || typeUpper.contains("냉동")) {
                item.setFridgeStatus("냉동");
            } else if (typeUpper.contains("ROOM") || typeUpper.contains("실온")) {
                item.setFridgeStatus("실온");
            } else {
                item.setFridgeStatus("냉장");
            }
        } else {
            item.setFridgeStatus("냉장"); // 기본값 세팅
        }
    }

    @Transactional
    public List<ProductDto> getAllStorageItems() {
        return repository.findAll().stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ProductDto getStorageItemById(Long id) {
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료를 찾을 수 없습니다. ID: " + id));
        return ProductDto.fromEntity(item);
    }

    @Transactional
    public void updateStorageItem(Long id, ProductDto dto) {
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료가 존재하지 않습니다. ID: " + id));

        Item realItem = findMasterItemOrThrow(dto.getId());

        item.setItem(realItem);
        item.setQuantity(dto.getQuantity());
        item.setExpirationdate(dto.getExpiry());

        if (dto.getType() != null) {
            String typeUpper = dto.getType().toUpperCase();
            try {
                if (typeUpper.equals("ROOM")) {
                    item.setStoragetype(Storagetype.ROOM_TEMP);
                } else {
                    item.setStoragetype(Storagetype.valueOf(typeUpper));
                }
            } catch (IllegalArgumentException e) {
                item.setStoragetype(Storagetype.REFRIGERATED);
            }
        }
    }

    @Transactional
    public void deleteStorageItem(Long id) {
        Storage_item item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 보관 재료가 존재하지 않습니다. ID: " + id));
        repository.delete(item);
    }

    public List<ProductDto> searchItemsByName(String name) {
        return itemRepository.findByNameContaining(name).stream()
                .map(item -> {
                    ProductDto dto = new ProductDto();
                    dto.setId(item.getId());
                    dto.setName(item.getName());
                    dto.setCategory(item.getCategory());

                    if (item.getFridgeStatus() != null) {
                        String status = item.getFridgeStatus();
                        if (status.contains("냉장") || status.contains("냉동") || status.contains("실온")) {
                            dto.setType(status);
                        } else {
                            dto.setType(status.toLowerCase());
                        }
                    } else {
                        dto.setType("냉장");
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateMasterItem(Long id, ProductDto dto) {

        Item item = findMasterItemOrThrow(id);

        item.setName(dto.getName());
        item.setCategory(dto.getCategory());

        parseAndSetFridgeStatus(item, dto.getType());
    }

    @Transactional
    public void deleteMasterItem(Long id) {

        Item item = findMasterItemOrThrow(id);

        entityManager.createQuery("DELETE FROM RecipeIngredient r WHERE r.item.id = :itemId")
                .setParameter("itemId", id)
                .executeUpdate();

        entityManager.createQuery("DELETE FROM Storage_item s WHERE s.item.id = :itemId")
                .setParameter("itemId", id)
                .executeUpdate();

        itemRepository.delete(item);
    }

    @Transactional
    public void saveMasterItem(ProductDto dto) {
        Item item = new Item();
        item.setName(dto.getName());
        item.setCategory(dto.getCategory());

        parseAndSetFridgeStatus(item, dto.getType());

        item.setCreatedAt(java.time.LocalDateTime.now());
        itemRepository.save(item);
    }
}