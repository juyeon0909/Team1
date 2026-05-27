package com.Plz.Beats.controller;

import com.Plz.Beats.config.JwtTokenProvider;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.service.PasswordlessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/passwordless")
@RequiredArgsConstructor
public class PasswordlessController {
    private final PasswordlessService passwordlessService;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;

    /**
     * 1. 사용자 등록 여부 확인 API
     */
    @GetMapping("/check-status")
    public ResponseEntity<Boolean> checkStatus(@RequestParam String email) {
        boolean isRegistered = passwordlessService.checkIsAp(email);
        return ResponseEntity.ok(isRegistered);
    }

    /**
     * 2. 등록 정보(QR코드) 요청 API
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestParam String email) {
        Map<String, Object> qrData = passwordlessService.requestJoinAp(email);
        return ResponseEntity.ok(qrData);
    }

    /**
     * 3. 모바일 푸시 인증 요청 API
     * 이메일로 푸시 알림을 전송하고 인증에 사용할 randomValue를 반환합니다.
     */
    @PostMapping("/getSp")
    public ResponseEntity<?> getSp(@RequestParam String email) {
        try {
            String randomValue = passwordlessService.requestSp(email);
            return ResponseEntity.ok(randomValue);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("인증 요청에 실패했습니다.");
        }
    }

    /**
     * 4. 승인 여부 확인 API (프론트엔드가 1초마다 폴링)
     */
    @GetMapping("/check-result")
    public ResponseEntity<Boolean> checkResult(@RequestParam String email, @RequestParam String randomValue) {
        boolean isApproved = passwordlessService.checkApprovalResultOnce(email, randomValue);
        return ResponseEntity.ok(isApproved);
    }

    /**
     * 5. 패스워드리스 로그인 완료 API
     * 승인이 확인된 후 JWT를 발급합니다.
     */
    @PostMapping("/passwordless-login")
    public ResponseEntity<?> passwordlessLogin(@RequestParam String email, @RequestParam String randomValue) {
        boolean isApproved = passwordlessService.checkApprovalResultOnce(email, randomValue);
        if (!isApproved) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "승인되지 않은 요청입니다."));
        }

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        String token = jwtTokenProvider.createToken(member);

        return ResponseEntity.ok(Map.of(
                "accessToken", token,
                "id", member.getId(),
                "name", member.getName(),
                "email", member.getEmail(),
                "role", member.getRole().toString()
        ));
    }

    /**
     * 6. 인증 취소 API
     */
    @PostMapping("/cancel")
    public ResponseEntity<Boolean> cancelAuth(@RequestParam String email, @RequestParam String randomValue) {
        boolean isCanceled = passwordlessService.cancelAuth(email, randomValue);
        return ResponseEntity.ok(isCanceled);
    }

    /**
     * 7. 패스워드리스 해지 API
     */
    @PostMapping("/withdrawal")
    public ResponseEntity<Boolean> withdrawAp(@RequestParam String email) {
        boolean isWithdrawn = passwordlessService.withdrawAp(email);
        return ResponseEntity.ok(isWithdrawn);
    }
}
