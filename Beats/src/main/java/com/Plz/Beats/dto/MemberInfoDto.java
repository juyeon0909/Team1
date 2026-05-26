package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberInfoDto {
    private String name;            //현재 이름
    private String profileimage;    //프로필 이미지
    private String email;           //이메일
}
