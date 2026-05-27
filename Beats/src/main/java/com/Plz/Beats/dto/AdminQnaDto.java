package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter @AllArgsConstructor
public class AdminQnaDto {
    private Long id;
    private String memberName;
    private String memberEmail;
    private String qnaType;
    private String title;
    private String content;
    private String status;
    private String answer;
    private String createdAt;
    private String answeredAt;
}