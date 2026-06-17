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

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";


    private Key signingKey;

    @PostConstruct
    protected void init() {
        this.signingKey = Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    private Key getSigningKey() {
        return signingKey;
    }


    public String createAccessToken(Member member) {
        Claims claims = Jwts.claims().setSubject(member.getEmail()); // subject = 사용자 식별자
        claims.put("role", member.getRole().name());                // SecurityContext 권한 복원에 사용
        claims.put(CLAIM_TYPE, TYPE_ACCESS);                        // 토큰 종류 표시
        return buildToken(claims, expiration);
    }


    public String createRefreshToken(Member member) {
        Claims claims = Jwts.claims().setSubject(member.getEmail());
        claims.put(CLAIM_TYPE, TYPE_REFRESH);
        return buildToken(claims, refreshExpiration);
    }


    private String buildToken(Claims claims, long ttlMillis) {
        Date now = new Date();
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)                                  // 발급 시각
                .setExpiration(new Date(now.getTime() + ttlMillis)) // 만료 시각
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // 서명
                .compact();                                        // 최종 JWT 문자열로 직렬화
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(getClaims(token).get(CLAIM_TYPE, String.class));
    }

    public String getEmail(String token) {
        return this.getClaims(token).getSubject();
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // 서명 검증에 사용할 키 지정
                .build()
                .parseClaimsJws(token)         // 서명 + 만료 동시 검증
                .getBody();                    // Payload 반환
    }

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
