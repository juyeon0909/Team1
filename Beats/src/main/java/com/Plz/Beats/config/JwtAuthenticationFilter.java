package com.Plz.Beats.config;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    // 아직 무의미한 null값임 - 값을 주입해야함
    private final JwtTokenProvider jwtTokenProvider ;

    // 값을 주입함
    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider){
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override // 모든 요청이 들어올 때 컨트롤러 보다 먼저 (한번만!) 실행이 되는 핵심 로직(메소드)
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        System.out.println(">>> JWT 필터 실행됨: " + request.getRequestURI()); // ← 추가

        // 요청 헤더에서 Authorization 값을 가져온다
        String bearer = request.getHeader("Authorization");

        // 값이 존재하고 "Bearer "로 시작하는지 확인한다
        if(bearer != null && bearer.startsWith("Bearer ")){
            // Bearer "를 제거하여 JWT 토큰만 추출한다
            String token = bearer.substring("Bearer ".length());

            try {  // ← 추가
                if(jwtTokenProvider.validateToken(token)){
                    String email = jwtTokenProvider.getEmail(token);
                    Claims claims = jwtTokenProvider.getClaims(token);
                    String role = claims.get("role", String.class);

                    List<GrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(email, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {  // ← 추가: 토큰 예외 발생 시 그냥 인증 없이 통과
                SecurityContextHolder.clearContext();


            }
        }

        filterChain.doFilter(request, response);
    }
}
{/* 커밋 */}