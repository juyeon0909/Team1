package com.Plz.Beats.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    // JwtTokenProvider.java에서 @Component로 생성함
    private final JwtTokenProvider jwtTokenProvider;

    // CorsConfig.java에 CorsConfigurationSource의 @Bean으로 객체 생성이 되어 있음
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        String[] permitUrls = {
                "/images/**",
                "/fruit/**",
                "/css/**",
                "/js/**",
                "/api/member/signup",
                "/api/member/login",
                "/api/mypage/**",
                "/product/**",
                "/first",
                "/"
        };

        http
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())

                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth
                        // A. 기존 팀원들이 열어둔 주소들을 한 방에 프리패스 시켜줍니다.
                        .requestMatchers(permitUrls).permitAll()
                        .requestMatchers("/api/member/join").permitAll()
                        .requestMatchers("/api/product/**").permitAll()
                        .requestMatchers("/api/mypage/**").authenticated()
//                                .hasAnyRole("USER", "ADMIN")
// 임시 주석              // B. 그 외의 모든 요청은 로그인 인증 필요
                        .anyRequest().authenticated()
                );

        // JWT 필터 등록
        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // 2. AuthenticationProvider는 별도의 Bean으로 분리하여 등록해 줍니다.
    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}