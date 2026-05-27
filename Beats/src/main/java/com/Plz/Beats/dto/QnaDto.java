package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class QnaDto {
    private Long id;
    private String qnaType;
    private String title;
    private String content;
    private String status;
    private String answer;
    private String createdAt;
    private String answeredAt;
}