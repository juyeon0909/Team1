package com.Plz.Beats.entity;

import com.Plz.Beats.constant.Storagetype;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "storage_items")
@Getter
@Setter
@ToString
@EntityListeners(AuditingEntityListener.class)
public class Storage_item {
    //보관함 식재료 id
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "storage_item_id")
    private Long id;

    //사용자 id를 외래키로 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    //식재료 id를 외래키로 참조
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    //냉장/냉동/실온 분류
    @Enumerated(EnumType.STRING)
    @Column(name = "storage_type", length = 50)
    @NotNull(message = "보관 타입은 필수입니다.")
    private Storagetype storagetype;

    //식재료 수량
    @Column(nullable = false)
    @Min(value = 0, message = "수량은 0개 이상이어야 합니다.")
    @Max(value = 1000, message = "수량은 1000개 이하여야 합니다.")
    private int quantity;

    //유통기한 입력
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "expiration_date")
    private LocalDate expirationdate;

    //등록 기간 자동
    @CreatedDate
    @Column(updatable = false, name = "created_at")
    private LocalDateTime inputdate;



}
