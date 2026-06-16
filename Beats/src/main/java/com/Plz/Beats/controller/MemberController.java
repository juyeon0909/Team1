package com.Plz.Beats.controller;

import com.Plz.Beats.config.JwtTokenProvider;
import com.Plz.Beats.dto.*;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.service.MemberDetailsService;
import com.Plz.Beats.service.MemberService;
import com.Plz.Beats.service.PasswordlessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
// [보안] CORS 정책은 CorsConfig 한 곳에서만 관리한다.
// 컨트롤러에 @CrossOrigin 을 하드코딩하면 설정이 이중화되어 혼선을 준다.
public class MemberController {
    private final MemberService memberService;
    private final MemberDetailsService memberDetailsServices;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final PasswordlessService passwordlessService;

    @PostMapping("/login")
    // LoginDto의 데이터를 객체에 담으려고 @RequestBody 작성
    // Long타입과 String타입을 동시에 만족하는 타입은 Object타입이여서 Object타입도 적음
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginDto dto) {

        // 1. 이메일로 유저 조회
        UserDetails userDetails;
        try {
            userDetails = memberDetailsServices.loadUserByUsername(dto.getEmail());
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "이메일 또는 비밀번호가 올바르지 않습니다."));
        }

        // 2. 패스워드리스 등록 여부 확인
        try {
            if (passwordlessService.checkIsAp(dto.getEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "패스워드리스로 로그인해주세요."));
            }
        } catch (Exception e) {
            // 패스워드리스 서버 장애 시 일반 로그인 허용
        }

        // 3. 비밀번호 검증
        if (!passwordEncoder.matches(dto.getPassword(), userDetails.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "이메일 또는 비밀번호가 올바르지 않습니다."));
        }

        // 4. JWT 토큰 발급 (access + refresh)
        Member member = memberService.findByEmail(dto.getEmail());
        String accessToken = jwtTokenProvider.createAccessToken(member);
        String refreshToken = jwtTokenProvider.createRefreshToken(member);

        // refresh token은 서버(DB)에도 저장해, 재발급 시 대조하고 강제 무효화도 가능하게 한다.
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
     * Access token 재발급 엔드포인트.
     *
     * [호출 시점]
     * 프론트엔드 API 호출이 401(access token 만료)로 실패하면, 저장해 둔 refresh token을
     * 이 엔드포인트로 보내 새 access token을 받는다. (axiosInstance 인터셉터가 자동 수행)
     *
     * [검증 단계]
     * 1) 요청 본문에 refresh token이 있는가
     * 2) 서명·만료가 유효한가 (validateToken)
     * 3) 진짜 refresh 종류의 토큰인가 (isRefreshToken)
     * 4) 서버(DB)에 저장된 값과 일치하는가 → 로그아웃/탈취로 무효화된 토큰 차단
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody TokenRefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        // 1) null/공백 체크 (다른 검사보다 먼저)
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "refresh token이 없습니다."));
        }

        // 2)+3) 서명·만료 검증과 토큰 종류 검증 (만료면 validateToken이 false → 뒤 검사 단락)
        if (!jwtTokenProvider.validateToken(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "유효하지 않은 refresh token입니다."));
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        Member member = memberService.findByEmail(email);

        // 4) DB에 저장된 refresh token과 일치하는지 확인 (null 체크를 먼저)
        if (member == null || !refreshToken.equals(member.getRefreshToken())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "만료되었거나 무효화된 refresh token입니다."));
        }

        // 새 access token 발급 (refresh token은 1일 유효 기간 동안 그대로 재사용)
        String newAccessToken = jwtTokenProvider.createAccessToken(member);
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }

    /**
     * 로그아웃 엔드포인트. 서버에 저장된 refresh token을 제거해 재발급을 불가능하게 만든다.
     * 프론트는 이 호출 후 localStorage의 토큰을 지운다.
     * (access token은 stateless라 만료 전까지 유효하지만 수명이 짧아 위험이 작다.)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        memberService.clearRefreshToken(principal.getName());
        return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
    }

    // @RequestBody : 넘어온 request정보가 JSON형식인데 그것을 Java 형식으로 바꿔주는 것
    // 원래 VSC(React-프론트앤드)에서 넘어온 데이터는 bean.getName같은거에 있음
    // Controller까지는 그대로의 데이터이고 그 이후인 Service에서 암호화를 하든 말든 함
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody Member bean, BindingResult bindingResult) { // 회원 가입하기
        System.out.println("회원 가입 정보");
        System.out.println(bean);

        if (bindingResult.hasErrors()) { // 가입에 뭔가 문제 있음
            Map<String, String> errors = new HashMap<>();
            for (FieldError xx : bindingResult.getFieldErrors()) { // Field : Java에서의 변수 (name, password 등)
                errors.put(xx.getField(), xx.getDefaultMessage());
            }
            System.out.println(errors);
            return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
        } else {
            System.out.println("ok");
        }

        // 이메일 중복 체크
        Member member = memberService.findByEmail(bean.getEmail());
        if (member != null) {
            // 이미 존재하는 이메일 주소
            return new ResponseEntity<>(Map.of("email", "이미 존재하는 이메일 주소입니다."),
                    HttpStatus.BAD_REQUEST);
        }

        // 회원 가입 처리
        memberService.insert(bean);
        return new ResponseEntity<>("회원 가입 성공", HttpStatus.OK); // 회원 가입 성공 (OK라는건 200번대라는 뜻)
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteMember(@RequestBody Map<String, String> request, Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }

        String requestEmail = request.get("email");
        String password = request.get("password");
        String principalEmail = principal.getName();

        // 입력한 이메일이 로그인한 본인 이메일과 다르면 거부
        if (!principalEmail.equals(requestEmail)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "본인 계정 이메일과 일치하지 않습니다."));
        }

        Member member = memberService.findByEmail(principalEmail);
        if (member == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "회원이 없습니다."));
        }

        if (!passwordEncoder.matches(password, member.getPassword())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "비밀번호 불일치"));
        }

        memberService.delete(member);
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 성공"));
    }


}
