package com.Plz.Beats.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // 이 파일은 스프링에서 설정용 파일로 사용하겠습니다.
@Profile("local")
public class WebConfig implements WebMvcConfigurer {
    @Value("${app.storage.local.root}")
    private String root;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + root + "/");   // 끝에 / 꼭 필요
    }

}
