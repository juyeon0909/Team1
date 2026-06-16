package com.Plz.Beats.controller;

import com.Plz.Beats.config.JwtTokenProvider;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.service.MemberService;
import com.Plz.Beats.service.PasswordlessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/passwordless")
@RequiredArgsConstructor
public class PasswordlessController {
    private final PasswordlessService passwordlessService;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;
    private final MemberService memberService;

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
            // Service에서 묶어준 Map(randomValue, servicePassword)을 그대로 받습니다.
            Map<String, String> result = passwordlessService.requestSp(email);

            // 리액트로 그대로 전달! (알아서 JSON으로 변환됨)
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
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

        // access + refresh 토큰 발급. refresh token은 서버(DB)에도 저장한다.
        String accessToken = jwtTokenProvider.createAccessToken(member);
        String refreshToken = jwtTokenProvider.createRefreshToken(member);
        memberService.updateRefreshToken(member.getEmail(), refreshToken);

        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
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
     *
     * [보안] 이메일을 파라미터로 받지 않고, 로그인된 사용자의 토큰에서 이메일을 꺼낸다.
     * 이렇게 하지 않으면 공격자가 남의 이메일을 넣어 임의로 패스워드리스(2차 보호)를
     * 해지시킬 수 있다(계정 보안 강제 약화).
     */
    @PostMapping("/withdrawal")
    public ResponseEntity<?> withdrawAp(Principal principal) {
        // principal 은 JWT 인증을 통과한 경우에만 채워진다. 없으면 비로그인 → 거부.
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }
        // principal.getName() = 토큰 subject = 본인 이메일. 즉 본인 것만 해지 가능.
        boolean isWithdrawn = passwordlessService.withdrawAp(principal.getName());
        return ResponseEntity.ok(isWithdrawn);
    }
}
