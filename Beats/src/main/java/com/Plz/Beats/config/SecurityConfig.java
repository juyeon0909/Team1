package com.Plz.Beats.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security 전체 보안 정책을 정의하는 설정 클래스.
 *
 * [왜 필요한가]
 * Spring Security는 기본적으로 모든 요청에 로그인 폼 인증을 요구하고 세션을 사용한다.
 * 이 클래스에서 그 기본 설정을 JWT 기반 Stateless 인증 방식으로 교체하고,
 * 경로별 접근 권한과 CORS 정책을 명시적으로 선언한다.
 *
 * [핵심 설정 요약]
 * - 세션 사용 안 함 (STATELESS) → JWT로 인증 상태를 대신 전달
 * - 폼 로그인·HTTP Basic 인증 비활성화 → REST API에서 불필요
 * - CSRF 보호 비활성화 → JWT는 쿠키를 사용하지 않으므로 CSRF 위협 없음
 * - JWT 필터를 Spring Security 필터 체인 앞에 삽입
 * - 경로별 접근 권한 (permitAll / authenticated / hasRole) 선언
 */
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity // @PreAuthorize, @PostAuthorize 등 메서드 수준 보안 어노테이션 활성화
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // 인증 없이 누구나 접근 가능한 경로 목록.
        // 이 경로들은 authorizeHttpRequests에서 permitAll()로 허용된다.
        String[] permitUrls = {
                "/images/**",
                "/fruit/**",
                "/css/**",
                "/js/**",
                "/api/recipeMain",
                "/error",
                "/api/error",
                "/api/recipeMain/**",
                "/api/member/signup",
                "/api/member/login",
                "/api/member/refresh",    // access token 재발급: 만료 상태에서 호출되므로 인증 없이 허용
                "/product/**",
                "/api/product/**",
                "/first",
                "/",
                "/api/member/delete",
                "/api/passwordless/**",   // 이메일 링크 로그인: 인증 전에 호출되므로 허용
                "/api/member/reset-password/**"
        };

        http
                // [HTTP Basic 인증 비활성화]
                // 브라우저가 username/password를 Base64로 인코딩해 헤더에 담는 방식.
                // REST API에서는 JWT를 사용하므로 불필요하다.
                .httpBasic(httpBasic -> httpBasic.disable())

                // [폼 로그인 비활성화]
                // Spring Security 기본 로그인 페이지(/login HTML 폼)를 비활성화.
                // 로그인은 /api/member/login 엔드포인트(JSON)로 처리한다.
                .formLogin(formLogin -> formLogin.disable())

                // [CORS 설정 적용]
                // CorsConfig에서 정의한 허용 Origin, 메서드, 헤더 규칙을 등록한다.
                // Spring Security 필터보다 CORS 사전 요청(Preflight, OPTIONS)이 먼저 처리된다.
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // [CSRF 보호 비활성화]
                // CSRF 공격은 브라우저가 쿠키를 자동으로 전송할 때 발생한다.
                // 이 앱은 JWT를 Authorization 헤더로 전달하므로 쿠키를 사용하지 않아 CSRF 위협이 없다.
                .csrf(csrf -> csrf.disable())

                // [세션 정책: STATELESS]
                // JWT 인증에서는 서버가 세션을 저장하지 않는다.
                // 각 요청은 토큰을 통해 독립적으로 인증된다.
                // STATELESS로 설정하면 HttpSession을 생성하지 않고 SecurityContext를 요청마다 초기화한다.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // [경로별 접근 권한 규칙]
                // 규칙은 선언 순서대로 평가된다. 먼저 매칭되는 규칙이 적용된다.
                // 구체적인 경로를 먼저 선언하고, 넓은 패턴을 나중에 선언해야 한다.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(permitUrls).permitAll()
                        .requestMatchers("/api/member/delete").permitAll()
                        .requestMatchers("/api/member/join").permitAll()
                        .requestMatchers("/api/member/refresh").permitAll()
                        .requestMatchers("/api/member/reset-password").permitAll()
                        .requestMatchers("/api/member/reset-password/**").permitAll()
                        .requestMatchers("/api/recipeMain").permitAll()       // 레시피 목록 공개
                        .requestMatchers("/api/recipeMain/**").permitAll()    // 레시피 상세 공개
                        .requestMatchers("/api/recipeMain/clip").authenticated() // 스크랩 목록: 로그인 필요
                        .requestMatchers("/api/mypage/like").authenticated()  // 좋아요 목록: 로그인 필요
                        .requestMatchers("/api/ingredients/**").permitAll()
                        .requestMatchers("/api/product/**").permitAll()
                        .requestMatchers("/api/mypage/**").authenticated()    // 마이페이지 전체: 로그인 필요
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")    // 관리자 전용: ADMIN 권한 필요
                        .anyRequest().authenticated()                         // 그 외 모든 요청: 로그인 필요
                );


        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService); // 사용자 조회 전략 주입
        provider.setPasswordEncoder(passwordEncoder);       // 비밀번호 검증 전략 주입
        return provider;
    }
}
