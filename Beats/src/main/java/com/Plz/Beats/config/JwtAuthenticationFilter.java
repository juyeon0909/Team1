package com.Plz.Beats.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;


@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        log.debug("JWT 필터 실행: {}", request.getRequestURI());

        // Authorization 헤더 추출
        // HTTP 표준(RFC 6750)에 따라 토큰은 "Authorization: Bearer <token>" 형식으로 전달된다.
        String bearer = request.getHeader("Authorization");

        // 헤더가 없거나 "Bearer "로 시작하지 않으면 토큰 없는 요청으로 간주하고 패스.
        // 이후 SecurityConfig의 authorizeHttpRequests 규칙이 접근 허용 여부를 판단한다.
        if (bearer != null && bearer.startsWith("Bearer ")) {

            // "Bearer " 7글자를 제거하여 순수 JWT 문자열만 추출한다.
            String token = bearer.substring("Bearer ".length());

            if (jwtTokenProvider.validateToken(token)) {
                // 토큰이 유효하다 → 사용자 식별 정보를 꺼내 인증 객체를 만든다.

                // [보안] refresh 토큰을 일반 API 인증에 사용하려는 시도를 차단한다.
                // access/refresh는 같은 키로 서명되므로, 종류(type)를 확인해 refresh면 거부한다.
                if (jwtTokenProvider.isRefreshToken(token)) {
                    SecurityContextHolder.clearContext();
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"잘못된 토큰 종류입니다. 다시 로그인해주세요.\"}");
                    return;
                }

                // 토큰의 subject(이메일)를 꺼낸다. SecurityContext의 principal로 사용된다.
                String email = jwtTokenProvider.getEmail(token);

                // 토큰의 payload에서 role 값을 꺼낸다.
                Claims claims = jwtTokenProvider.getClaims(token);
                String role = claims.get("role", String.class);

                // Spring Security 권한 목록 생성.
                // SimpleGrantedAuthority에는 반드시 "ROLE_" 접두사가 붙어야
                // SecurityConfig의 .hasRole("ADMIN") 등과 매칭된다.
                List<GrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + role));

                // UsernamePasswordAuthenticationToken: Spring Security의 인증 완료 객체.
                // 세 번째 인자(authorities)가 있으면 "인증 완료" 상태로 간주된다.
                // 두 번째 인자(credentials/password)는 이미 검증이 끝났으므로 null로 설정.
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                // SecurityContextHolder에 인증 객체를 저장한다.
                // 이후 컨트롤러에서 @AuthenticationPrincipal 또는
                // SecurityContextHolder.getContext().getAuthentication()으로 사용자 정보를 꺼낼 수 있다.
                // Thread-Local 기반이므로 요청이 끝나면 자동으로 비워진다.
                SecurityContextHolder.getContext().setAuthentication(auth);

            } else {
                // 토큰이 존재하지만 만료되었거나 위·변조된 경우.
                // SecurityContext를 명시적으로 비워 이전 인증 상태가 남지 않게 한다.
                SecurityContextHolder.clearContext();

                // 필터 체인을 중단하고 즉시 401 Unauthorized를 응답한다.
                // 컨트롤러까지 요청이 도달하지 않는다.
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"인증이 만료되었습니다. 다시 로그인해주세요.\"}");
                return; // filterChain.doFilter()를 호출하지 않고 즉시 종료
            }
        }

        // 토큰이 없거나 정상 처리된 경우: 다음 필터 또는 컨트롤러로 요청을 넘긴다.
        filterChain.doFilter(request, response);
    }
}
