package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RecipeLikeDto {
    private Long id;
    private String title;
    private String category;    //카테고리
    private String time;        //시간
    private String author;      //레시피 작성자
    private long likes;         //좋아요
    private boolean liked;      // 좋아요 목록
    private String scrappedAt;  //날짜
}
