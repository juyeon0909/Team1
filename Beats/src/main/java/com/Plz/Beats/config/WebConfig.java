package com.Plz.Beats.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // 이 파일은 스프링에서 설정용 파일로 사용하겠습니다.
public class WebConfig implements WebMvcConfigurer {
//    @Override
//    public void addCorsMappings(CorsRegistry registry) {
//        // 3000번 포트에서 GET부터 PATCH까지의 열거한 요청들을 모두 수락하겠습니다.
//        registry.addMapping("/**")
//                .allowedOrigins("http://localhost:5173", "http://localhost:3000","https://eatsfridge.site","http://eatsfridge.site")
//                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
//                .allowCredentials(true) ; // 쿠키 전송 허용
//    }

}
