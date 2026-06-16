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

/**
 * 모든 HTTP 요청에서 JWT 토큰을 추출·검증하고, 유효하면 인증 정보를 SecurityContext에 등록하는 필터.
 *
 * [왜 필요한가]
 * JWT 인증 방식에서는 서버가 세션을 저장하지 않는다.
 * 따라서 "이 요청을 보낸 사람이 누구인가"를 매 요청마다 토큰을 통해 확인해야 한다.
 * 이 필터가 컨트롤러보다 먼저 실행되어 인증 상태를 결정한다.
 *
 * [OncePerRequestFilter를 상속하는 이유]
 * Spring에서 필터 체인은 Forward/Include 등으로 같은 요청이 여러 번
 * 필터를 통과할 수 있다. OncePerRequestFilter는 요청당 정확히 한 번만
 * doFilterInternal()을 실행하도록 보장해 중복 인증 처리를 방지한다.
 *
 * [흐름]
 * HTTP 요청
 *   → doFilterInternal() 실행
 *   → Authorization 헤더에서 "Bearer <token>" 추출
 *   → JwtTokenProvider.validateToken()으로 검증
 *   → 유효하면 SecurityContextHolder에 인증 객체 등록
 *   → filterChain.doFilter()로 다음 필터(또는 컨트롤러)에 요청 전달
 */
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /**
     * JWT 토큰의 생성·검증 로직을 가진 컴포넌트.
     * 이 필터는 @Component가 아니라 SecurityConfig에서 직접 new로 생성되기 때문에,
     * Spring이 자동으로 의존성을 주입해 주지 않는다.
     * 따라서 생성자를 통해 직접 주입받는다.
     */
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * SecurityConfig에서 이 필터를 등록할 때 JwtTokenProvider를 인자로 넘겨
     * 의존성을 주입한다.
     *
     * [왜 생성자 주입인가]
     * 필드 주입(@Autowired)은 Spring 컨테이너가 관리하는 Bean에서만 동작한다.
     * 이 클래스는 new로 생성되므로 반드시 생성자로 주입해야 한다.
     */
    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * 매 HTTP 요청마다 실행되는 핵심 필터 로직.
     *
     * [언제 호출되는가]
     * SecurityConfig에서 UsernamePasswordAuthenticationFilter 앞에 등록했기 때문에,
     * Spring Security의 기본 인증 처리보다 먼저 실행된다.
     *
     * [처리 흐름]
     * 1. Authorization 헤더에서 "Bearer " 접두사를 가진 값을 꺼낸다.
     * 2. "Bearer " 이후의 순수 토큰 문자열을 추출한다.
     * 3. JwtTokenProvider로 토큰 유효성을 검사한다.
     *    - 유효하면: 이메일과 role을 꺼내 SecurityContext에 인증 객체를 등록한다.
     *    - 유효하지 않으면(만료·위조): 401 응답을 즉시 반환하고 필터 체인을 중단한다.
     * 4. Authorization 헤더가 없거나 "Bearer "로 시작하지 않으면 아무것도 하지 않고
     *    다음 필터로 넘긴다 (비로그인 요청 → Security가 permitAll/authenticated 규칙으로 판단).
     *
     * @param request     클라이언트 HTTP 요청
     * @param response    서버 HTTP 응답
     * @param filterChain 다음 필터 또는 컨트롤러로 이어지는 체인
     */
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
