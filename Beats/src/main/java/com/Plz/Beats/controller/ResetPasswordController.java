package com.Plz.Beats.controller;

import com.Plz.Beats.dto.PasswordResetDto;
import com.Plz.Beats.dto.ApiResponse;
import com.Plz.Beats.service.ResetPasswordService;
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

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse> verify(@Valid @RequestBody PasswordResetDto.VerifyRequest request) {
        resetPasswordService.verifyIdentity(request.getName(), request.getEmail());
        return ResponseEntity.ok(ApiResponse.of("본인 확인이 완료되었습니다."));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse> reset(@Valid @RequestBody PasswordResetDto.ResetRequest request) {
        resetPasswordService.resetPassword(request.getName(), request.getEmail(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.of("비밀번호가 변경되었습니다."));
    }
}