package com.Plz.Beats.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordUpdateDto {
    private String currentPassword; //현재 패스워드
    private String newPassword;     //변경할 패스워드
}
