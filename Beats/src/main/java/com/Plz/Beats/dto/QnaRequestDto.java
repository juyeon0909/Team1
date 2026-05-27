package com.Plz.Beats.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class QnaRequestDto {
    private String qnaType;
    private String title;
    private String content;
}
