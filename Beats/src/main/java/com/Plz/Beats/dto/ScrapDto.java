package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ScrapDto {
    private Long   id;
    private String title;
    private String category;
    private String time;
    private String author;
    private long   likes;       // 스크랩 수
    private boolean scrapped;
    private String scrappedAt;
    private String image;
    // star 제거
}