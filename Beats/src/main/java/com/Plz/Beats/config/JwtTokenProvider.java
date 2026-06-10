package com.Plz.Beats.config;

import com.Plz.Beats.entity.Member;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * JWT 토큰의 생성·파싱·검증을 전담하는 컴포넌트.
 *
 * [왜 필요한가]
 * 서버가 세션을 저장하지 않는 Stateless 구조(JWT 인증)에서는,
 * 클라이언트가 보낸 토큰이 진짜인지·만료되지 않았는지를 매 요청마다
 * 서버가 직접 확인해야 한다. 이 클래스가 그 역할을 수행한다.
 *
 * [흐름 요약]
 * 로그인 성공 → createToken() → 토큰을 클라이언트에 반환
 * 이후 요청   → JwtAuthenticationFilter → validateToken() → getEmail()/getClaims() → 인증 완료
 */
@Slf4j
@Component
public class JwtTokenProvider {

    /**
     * application.properties의 jwt.secret 값을 주입받는다.
     * 이 값은 HMAC-SHA256 서명에 사용되는 비밀 키의 원재료이므로,
     * 절대 외부에 노출되어서는 안 된다 (환경 변수나 Secrets Manager로 관리 권장).
     */
    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * application.properties의 jwt.expiration 값을 주입받는다.
     * 단위: 밀리초 (ms). 예) 3600000 = 1시간
     * 너무 길면 탈취된 토큰이 오래 유효하고, 너무 짧으면 UX가 나빠진다.
     */
    @Value("${jwt.expiration}")
    private long expiration;

    /**
     * HMAC-SHA256 서명에 사용할 Key 객체.
     * String → byte[] → Key 변환은 비용이 크므로 Bean 초기화 시 한 번만 수행한다.
     */
    private Key signingKey;

    /**
     * [왜 @PostConstruct인가]
     * @Value 주입은 생성자 실행 이후에 완료된다.
     * 생성자에서 signingKey를 초기화하면 secretKey가 아직 null이므로
     * @PostConstruct를 사용해 주입 완료 이후 시점에 초기화한다.
     *
     * Keys.hmacShaKeyFor()는 JJWT가 제공하는 안전한 Key 생성 유틸로,
     * HS256 알고리즘에 필요한 최소 256비트(32바이트)를 충족하는지 검증해 준다.
     */
    @PostConstruct
    protected void init() {
        this.signingKey = Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    /**
     * 내부에서만 서명 키를 참조하도록 private으로 캡슐화.
     * 서명 키가 외부 클래스로 직접 노출되지 않도록 막는다.
     */
    private Key getSigningKey() {
        return signingKey;
    }

    /**
     * 로그인에 성공한 사용자에게 발급할 JWT 토큰을 생성한다.
     *
     * [언제 호출하는가]
     * MemberController의 로그인 엔드포인트에서 이메일·비밀번호 인증이 통과된 직후 호출한다.
     *
     * [토큰 구조]
     *   Header  : 알고리즘(HS256), 타입(JWT)
     *   Payload : subject(이메일), role(권한), iat(발급 시각), exp(만료 시각)
     *   Signature: HMAC-SHA256(header + payload, signingKey) → 위·변조 방지
     *
     * @param member 토큰에 식별 정보를 담을 회원 엔티티
     * @return 서명된 JWT 문자열 (클라이언트에 전달)
     */
    public String createToken(Member member) {
        Claims claims = Jwts.claims().setSubject(member.getEmail()); // subject = 사용자 식별자
        claims.put("role", member.getRole().name()); // SecurityContext 권한 복원에 사용

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date())                                             // 발급 시각
                .setExpiration(new Date(System.currentTimeMillis() + expiration))   // 만료 시각
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)                 // 서명
                .compact(); // 최종 JWT 문자열로 직렬화
    }

    /**
     * 토큰의 Payload에서 이메일(subject)을 꺼낸다.
     *
     * [언제 호출하는가]
     * JwtAuthenticationFilter에서 토큰 검증 후 SecurityContext에
     * 인증 객체를 등록할 때 사용자 식별자(이메일)가 필요하다.
     *
     * @param token 검증된 JWT 문자열
     * @return 토큰에 담긴 이메일
     */
    public String getEmail(String token) {
        return this.getClaims(token).getSubject();
    }

    /**
     * 토큰의 Payload 전체(Claims)를 파싱해 반환한다.
     *
     * [언제 호출하는가]
     * 이메일 외에 role 등 추가 클레임이 필요할 때 사용한다.
     * JwtAuthenticationFilter에서 권한 정보(role)를 꺼낼 때 호출한다.
     *
     * [주의]
     * 서명 검증 + 만료 검증을 내부적으로 수행하므로,
     * validateToken()을 통과한 토큰에 대해서만 호출해야 한다.
     * 만료된 토큰을 넘기면 ExpiredJwtException이 발생한다.
     *
     * @param token 검증된 JWT 문자열
     * @return 파싱된 Claims 객체
     */
    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // 서명 검증에 사용할 키 지정
                .build()
                .parseClaimsJws(token)         // 서명 + 만료 동시 검증
                .getBody();                    // Payload 반환
    }

    /**
     * 토큰이 유효한지(형식·서명·만료) 검사한다.
     *
     * [언제 호출하는가]
     * JwtAuthenticationFilter에서 매 HTTP 요청마다 가장 먼저 호출한다.
     * 이 메서드가 false를 반환하면 필터가 즉시 401을 응답하고 컨트롤러까지 도달하지 않는다.
     *
     * [예외 종류별 의미]
     * - ExpiredJwtException     : 유효 기간이 지난 토큰 → 재로그인 필요
     * - MalformedJwtException   : JWT 형식(헤더.페이로드.서명 3파트)이 깨진 토큰
     * - SecurityException       : 서명 불일치 → 토큰이 위·변조됨
     * - 기타 Exception          : 파싱 불가 등 예측 외 오류
     *
     * @param token 클라이언트가 보낸 JWT 문자열
     * @return 유효하면 true, 그 외 false
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token); // 검증 실패 시 예외 발생
            return true;

        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰입니다.");
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.warn("JWT 서명 또는 형식이 올바르지 않습니다.");
        } catch (Exception e) {
            log.warn("JWT 처리 중 오류 발생: {}", e.getMessage());
        }
        return false;
    }
}
