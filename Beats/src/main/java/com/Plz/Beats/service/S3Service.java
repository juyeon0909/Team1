package com.Plz.Beats.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    // S3Config가 만든 접속 객체 받아오기
    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}") // 버킷 이름
    private String bucket;

    public String uploadFile(MultipartFile file)
            throws IOException {

        // UUID 파일명 생성
        // 파일명이 겹치지 않도록 UUID(랜덤문자)를 붙여줌
        // 예) a1b2c3_고양이.jpg
        String fileName =
                UUID.randomUUID() + "_" +
                        file.getOriginalFilename();

        // S3 업로드 요청
        // 이 버킷에, 이 이름으로, 파일을 이런 타입으로 , 올리세요
        // 하고 주문서를 작성
        PutObjectRequest putObjectRequest =
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(fileName)
                        .contentType(file.getContentType())
                        .build();

        // 여기가 실제로 업로드가 실행됨.
        // 주문서 + 파일의 실제 바이트 데이터
        s3Client.putObject(
                putObjectRequest,
                RequestBody.fromBytes(file.getBytes())
        );

        // 업로드가 끝났다면,
        // 그 파일에 접근할 수 있는 url 생성.
        return "https://" + bucket + ".s3.ap-northeast-2.amazonaws.com/" + fileName;
    }

    public String uploadBase64(String base64Image) throws IOException {
        // "data:image/png;base64,XXXX" 에서 실제 데이터 분리
        String[] parts = base64Image.split(",");
        String imageData = parts.length > 1 ? parts[1] : parts[0];
        String mimeType = parts.length > 1
                ? parts[0].split(":")[1].split(";")[0]
                : "image/jpeg";

        byte[] imageBytes = java.util.Base64.getDecoder().decode(imageData);
        String extension = mimeType.split("/")[1];
        String fileName = UUID.randomUUID() + "." + extension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(fileName)
                .contentType(mimeType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(imageBytes));

        return "https://" + bucket + ".s3.ap-northeast-2.amazonaws.com/" + fileName;
    }
}
