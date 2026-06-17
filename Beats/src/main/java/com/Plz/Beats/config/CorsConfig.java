package com.Plz.Beats.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration // 설정 파일임을 의미
public class CorsConfig {
    // 객체임을 의미
    @Bean // Spring Security가 이 Bean을 읽어서 CORS 정책으로 사용합니다.
    public CorsConfigurationSource corsConfigurationSource(){
        // configuration 객체는 클라이언트로부터 요청이 들어 왔을 때 CORS 정책을 적용시켜주는 객체
        CorsConfiguration configuration = new CorsConfiguration();

        // 리액트의 포트 번호를 여기에 작성
        // [보안] 허용 출처는 실제 사용하는 곳만 명시한다.
        // - 원시 IP(54.180.0.163)와 미사용 출처(https://localhost:3000)는 제거.
        // - localhost:5173 은 로컬 개발용(Vite). 운영만 쓸 거면 이 줄도 빼면 된다.
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "https://eatsfridge.site",
                "https://www.eatsfridge.site"
        ));


        // 허용 HTTP 메소드 — 필요한 것만. allowCredentials(true) 와 함께 "*" 를 섞지 않는다.
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type", // MIME 타입
                "Accept"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source
                = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);



        // 구현체를 리턴함
        return source ;
    }
}
