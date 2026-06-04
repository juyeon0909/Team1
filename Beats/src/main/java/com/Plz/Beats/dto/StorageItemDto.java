package com.Plz.Beats.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class StorageItemDto {
    private Long id;
    private String itemName;
    private int quantity;
    private String storageType;  // "냉장" / "냉동" / "실온"

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationDate;

    private long dDay;           // 남은 일수 (음수면 이미 만료)
    private String urgency;      // "urgent" / "warning" / "normal"
    private int progressPercent; // 진행바 너비 (%)

    private String category;
}
