package com.Plz.Beats.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class StorageItemRegisterDto {
    private Long memberId;
    private String itemname;
    private Long itemId;
    private String storagetype;   // "REFRIGERATED" / "FROZEN" / "ROOM_TEMP"
    private int quantity;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationdate;
}
