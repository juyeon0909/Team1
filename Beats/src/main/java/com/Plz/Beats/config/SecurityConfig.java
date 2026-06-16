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

    /**
     * JWT 생성·검증을 담당하는 컴포넌트 (@Component로 등록된 Bean).
     * JwtAuthenticationFilter 생성 시 생성자 인자로 전달한다.
     */
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * CORS 허용 정책이 정의된 Bean (CorsConfig.java에서 @Bean으로 등록).
     * 프론트엔드(React)와 백엔드의 Origin이 다르기 때문에 CORS 설정이 필수다.
     */
    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * 비밀번호 단방향 해시 암호화기.
     *
     * [왜 BCrypt인가]
     * BCrypt는 bcrypt 알고리즘을 사용하며, 내부적으로 랜덤 Salt를 포함해
     * 같은 비밀번호라도 해시 결과가 매번 다르다. 이로써 Rainbow Table 공격을 방어한다.
     * 또한 work factor(반복 횟수)를 조절할 수 있어 하드웨어가 빨라져도 대응 가능하다.
     *
     * [언제 사용되는가]
     * 회원가입 시 비밀번호 저장: passwordEncoder.encode(rawPassword)
     * 로그인 시 검증:           passwordEncoder.matches(rawPassword, storedHash)
     * DaoAuthenticationProvider에서 자동으로 호출한다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * HTTP 보안 필터 체인 설정.
     *
     * [왜 SecurityFilterChain을 @Bean으로 등록하는가]
     * Spring Security 5.7 이후 WebSecurityConfigurerAdapter가 deprecated되었다.
     * 대신 SecurityFilterChain을 Bean으로 등록하는 방식을 권장한다.
     * 여러 SecurityFilterChain을 등록해 URL별로 다른 보안 정책을 적용할 수도 있다.
     */
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

        // [JWT 필터 등록]
        // JwtAuthenticationFilter를 UsernamePasswordAuthenticationFilter 앞에 삽입한다.
        // 이렇게 하면 모든 요청에서 Spring Security 기본 인증 처리 전에 JWT 검증이 먼저 실행된다.
        // 토큰이 유효하면 SecurityContext에 인증 정보가 등록된 채로 다음 필터로 넘어간다.
        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    /**
     * Spring Security의 인증 처리 핵심 객체.
     *
     * [언제 사용하는가]
     * MemberController의 로그인 엔드포인트에서 이메일·비밀번호를 검증할 때 직접 호출한다.
     * authenticationManager.authenticate(token)을 호출하면 내부적으로
     * DaoAuthenticationProvider → MemberDetailsService.loadUserByUsername() 순으로 실행된다.
     *
     * [왜 AuthenticationConfiguration에서 꺼내는가]
     * Spring Boot 3.x에서 AuthenticationManager를 Bean으로 직접 생성하면
     * 순환 의존성(Circular Dependency)이 발생할 수 있다.
     * AuthenticationConfiguration.getAuthenticationManager()를 통해 꺼내면
     * Spring이 안전하게 관리하는 인스턴스를 얻을 수 있다.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * DB 기반 인증 처리자.
     *
     * [역할]
     * 1. MemberDetailsService.loadUserByUsername(email)로 DB에서 사용자 정보를 조회한다.
     * 2. 조회된 UserDetails의 password와 로그인 시 입력된 password를
     *    PasswordEncoder.matches()로 비교한다.
     * 3. 일치하면 인증 성공, 불일치하면 BadCredentialsException을 발생시킨다.
     *
     * [언제 동작하는가]
     * AuthenticationManager.authenticate()가 호출될 때
     * 등록된 AuthenticationProvider 목록을 순회하며 적합한 것을 선택해 인증을 위임한다.
     * DaoAuthenticationProvider는 UsernamePasswordAuthenticationToken을 처리한다.
     */
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
