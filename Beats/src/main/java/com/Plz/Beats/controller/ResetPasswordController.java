package com.Plz.Beats.controller;

import com.Plz.Beats.dto.ApiResponse;
import com.Plz.Beats.dto.PasswordResetDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/member/reset-password")
@RequiredArgsConstructor
public class ResetPasswordController {

    private final com.Plz.Beats.service.ResetPasswordService resetPasswordService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse> sendCode(@Valid @RequestBody PasswordResetDto.VerifyRequest request) {
        // 기존 verifyIdentity 대신, 메일 발송까지 처리하는 고도화된 서비스 메서드 호출!
        resetPasswordService.verifyIdentityAndSendCode(request.getName(), request.getEmail());
        return ResponseEntity.ok(ApiResponse.of("입력하신 이메일로 인증번호가 발송되었습니다."));
    }
    @PostMapping("/verify-code")
    public ResponseEntity<ApiResponse> verifyCode(@Valid @RequestBody PasswordResetDto.CodeCheckRequest request) {
        // 리액트가 보낸 이메일과 인증번호 코드를 들고 가방 실측 대조 작동
        resetPasswordService.verifyAuthenticationCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.of("이메일 인증이 성공적으로 완료되었습니다."));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse> reset(@Valid @RequestBody PasswordResetDto.ResetRequest request) {
        resetPasswordService.resetPassword(request.getName(), request.getEmail(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.of("비밀번호가 변경되었습니다."));
    }
}
/* 커밋 체크 */