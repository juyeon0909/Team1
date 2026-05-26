package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberInfoResponse {
    private String name;
    private String profileimage;
    private String email;
}
