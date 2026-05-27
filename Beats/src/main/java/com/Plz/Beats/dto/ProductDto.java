package com.Plz.Beats.dto;

import com.Plz.Beats.entity.Storage_item;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private Long id;
    private String name;
    private String category;
    private int quantity;
    private LocalDate expiry; // 리액트의 expiry ➡️ 엔티티의 expirationdate
    private String type;      // 리액트의 type ➡️ 엔티티의 storagetype (소문자 문자열로 처리)

    /**
     * 🔄 [정적 팩토리 메서드]
     * MySQL에서 꺼내온 무거운 엔티티(Storage_item) 알맹이를
     * 리액트에게 던져줄 가벼운 DTO 가방으로 싹 변환해주는 역할을 합니다.
     */
    public static ProductDto fromEntity(Storage_item entity) {
        return new ProductDto(
                entity.getId(),
                entity.getItem() != null ? entity.getItem().getName() : "이름 없음",
                // 🌟 [교정] items 테이블에 들어있는 진짜 카테고리를 꺼내와 DTO 카테고리 자리에 꽂아줍니다!
                entity.getItem() != null ? entity.getItem().getCategory() : "기타",
                entity.getQuantity(),
                entity.getExpirationdate(),
                // 백엔드 Enum(FROZEN 등)을 리액트가 좋아하는 소문자(frozen) 문자열로 치환
                entity.getStoragetype() != null ? entity.getStoragetype().name().toLowerCase() : "refrigerated"
        );
    }
}