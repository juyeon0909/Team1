package com.Plz.Beats.entity;

import jakarta.persistence.*; // Id, Table, Column, UniqueConstraint 등을 한 번에 임포트
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime; // 💡 임포트 추가
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor // Lombok: 기본 생성자 자동 생성 (JPA 필수)
@Entity
@Table(name = "items", uniqueConstraints = {
        @UniqueConstraint(
                name = "uk_item_name",         // 생성될 UK 제약조건의 이름
                columnNames = {"item_name"}    // 💡 아래 @Column(name)과 일치시켰습니다.
        )
})
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")  // pk 컬럼 이름 : 테이블단수명_id
    private Long id;

    // 💡 name = "item_name"을 명시하여 상단 유니크 제약조건과 매핑을 맞추었습니다.
    // 필드 레벨의 unique = true는 상단과 중복되므로 제거해도 안전합니다.
    @Column(name = "item_name", nullable = false)
    private String name;

    private String category;

    @Column(name = "fridge_status", length = 50)
    private String fridgeStatus;

    @Column(name = "item_unit", length = 200)
    private String itemUnit;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // TIMESTAMP

    @OneToMany(mappedBy = "item", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<Storage_item> storageItems = new ArrayList<>();
}