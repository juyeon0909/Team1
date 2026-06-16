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
 * 로그인 성공 → createAccessToken()/createRefreshToken() → 토큰을 클라이언트에 반환
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
     * Refresh token(재발급용 토큰)의 유효 기간. 단위: 밀리초(ms).
     * application.properties의 jwt.refresh-expiration 값을 주입받는다. 예) 86400000 = 1일
     * Access token보다 길게 잡아, access token이 만료돼도 사용자가 다시 로그인하지 않고
     * 이 토큰으로 새 access token을 발급받게 한다.
     */
    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    /** 토큰 종류를 구분하기 위한 클레임 키와 값. access token을 refresh 용도로 악용하는 것을 막는다. */
    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

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
    public String createAccessToken(Member member) {
        Claims claims = Jwts.claims().setSubject(member.getEmail()); // subject = 사용자 식별자
        claims.put("role", member.getRole().name());                // SecurityContext 권한 복원에 사용
        claims.put(CLAIM_TYPE, TYPE_ACCESS);                        // 토큰 종류 표시
        return buildToken(claims, expiration);
    }

    /**
     * 재발급(refresh)용 JWT를 생성한다.
     *
     * [용도]
     * access token이 만료됐을 때, 클라이언트가 이 토큰을 /api/member/refresh로 보내면
     * 서버가 검증 후 새 access token을 발급한다. 그래서 access token보다 유효 기간이 길다.
     *
     * [담는 정보]
     * role 같은 권한 정보는 넣지 않는다(재발급 시 DB에서 최신 권한을 다시 읽어오므로 불필요).
     * subject(이메일)와 type(refresh)만 담는다.
     *
     * @param member 토큰 소유자
     * @return 서명된 refresh JWT 문자열
     */
    public String createRefreshToken(Member member) {
        Claims claims = Jwts.claims().setSubject(member.getEmail());
        claims.put(CLAIM_TYPE, TYPE_REFRESH);
        return buildToken(claims, refreshExpiration);
    }

    /**
     * 공통 토큰 빌드 로직. claims와 유효 기간(ms)을 받아 서명된 JWT 문자열을 만든다.
     * access/refresh 토큰 생성에서 중복되는 부분을 한곳으로 모은다.
     */
    private String buildToken(Claims claims, long ttlMillis) {
        Date now = new Date();
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)                                  // 발급 시각
                .setExpiration(new Date(now.getTime() + ttlMillis)) // 만료 시각
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // 서명
                .compact();                                        // 최종 JWT 문자열로 직렬화
    }

    /**
     * 전달된 토큰이 refresh 토큰인지 확인한다.
     *
     * [왜 필요한가]
     * access token과 refresh token은 같은 서명 키로 만들어지므로, 누군가 refresh token을
     * Authorization 헤더에 넣어 일반 API에 접근하려 할 수 있다. 인증 필터에서 이 메서드로
     * refresh 토큰을 걸러내 그런 악용을 막는다.
     *
     * [주의] type 클레임이 없는 (구버전) 토큰은 false를 반환한다 → 기존 access token 호환 유지.
     *
     * @param token 검증이 끝난 JWT 문자열
     * @return refresh 토큰이면 true
     */
    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(getClaims(token).get(CLAIM_TYPE, String.class));
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
