package com.Plz.Beats.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class PasswordResetDto {

    // 본인 확인
    @Getter @NoArgsConstructor
    public static class VerifyRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
    }
    @Getter @NoArgsConstructor
    public static class CodeCheckRequest {
        @NotBlank @Email private String email;
        @NotBlank private String code; // 리액트가 보낸 6자리 인증번호가 여기에 안착합니다.
    }

    // 초기화 (확인 + 새 비번 한 번에)
    @Getter @NoArgsConstructor
    public static class ResetRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank private String newPassword;
    }
}
/* 커밋 체크 */