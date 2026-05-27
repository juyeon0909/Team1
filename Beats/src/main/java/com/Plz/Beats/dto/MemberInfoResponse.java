package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor // 3개의 데이터를 받는 생성자를 자동으로 만들어줍니다.
public class MemberInfoResponse {
    private String name;
    private String profileimage;
    private String email;
}