package com.Plz.Beats.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

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

                // 💡 3. [협업용 병합] 팀원들의 규칙과 유저님의 규칙을 아름답게 합쳤습니다.
                .authorizeHttpRequests(auth -> auth
                        // A. 기존 팀원들이 열어둔 주소들을 한 방에 프리패스 시켜줍니다.
                        .requestMatchers(permitUrls).permitAll()

                        // B. 혹시 몰라 팀원들 배열에 없던 'join' 주소도 안전하게 추가해줍니다.
                        .requestMatchers("/api/member/join").permitAll()

                        // C. 유저님이 만드신 냉장고 API는 USER와 ADMIN만 통과하도록 성벽을 칩니다.
                        .requestMatchers("/api/product/**").hasAnyAuthority("USER", "ADMIN")

                        // D. 그 외의 모든 요청은 로그인 인증 필요
                        .anyRequest().authenticated()
                );

        // 💡 4. [기존 유지] JWT 필터 등록
        http.addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

}