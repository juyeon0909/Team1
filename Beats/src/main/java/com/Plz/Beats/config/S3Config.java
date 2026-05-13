package com.Plz.Beats.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration // 이 클래스가 Spring 설정 클래스임을 의미
public class S3Config {
    // application.yml 또는 application.properties 에서
    // access-key 값을 가져옴
    @Value("${cloud.aws.credentials.access-key}")
    private String accessKey;

    // secret-key 값을 가져옴
    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;

    // AWS Region 값을 가져옴
    // 예: ap-northeast-2 (서울)
    @Value("${cloud.aws.region.static}")
    private String region;

    // Spring Bean 으로 S3Client 등록
    // 다른 클래스에서 @Autowired 또는 생성자 주입으로 사용 가능
    @Bean
    public S3Client s3Client() {

        // AWS Access Key 와 Secret Key 로 인증 객체 생성
        AwsBasicCredentials awsCreds =
                AwsBasicCredentials.create(accessKey, secretKey);

        // S3Client 생성
        return S3Client.builder()

                // AWS 리전 설정
                .region(Region.of(region))

                // 인증 정보 등록
                .credentialsProvider(
                        StaticCredentialsProvider.create(awsCreds)
                )

                // 최종적으로 S3Client 객체 생성
                .build();
    }
}
