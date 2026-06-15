package com.Plz.Beats.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    // S3Config가 만든 접속 객체 받아오기
    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}") // 버킷 이름
    private String bucket;

    // [보안] 허용할 이미지 형식만 화이트리스트로 정의한다.
    // key = MIME 타입, value = 서버가 강제로 붙일 안전한 확장자.
    // 이렇게 하지 않으면 공격자가 svg/html 을 올려 S3 URL로 스크립트를 실행(저장형 XSS)할 수 있다.
    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png",  "png",
            "image/webp", "webp",
            "image/gif",  "gif"
    );

    // MIME 타입이 허용 목록에 있는지 확인하고, 없으면 업로드를 거부한다.
    private String requireAllowedExtension(String mimeType) {
        String ext = mimeType == null ? null : ALLOWED_IMAGE_TYPES.get(mimeType.toLowerCase());
        if (ext == null) {
            throw new IllegalArgumentException(
                    "허용되지 않은 이미지 형식입니다. (jpg, png, webp, gif 만 가능)");
        }
        return ext;
    }

    public String uploadFile(MultipartFile file)
            throws IOException {

        // [보안] 클라이언트가 보낸 Content-Type 을 화이트리스트로 검증한다.
        String contentType = file.getContentType();
        String extension = requireAllowedExtension(contentType);

        // 파일명은 서버가 UUID + 검증된 확장자로 직접 만든다.
        // 원본 파일명(공격자 제어)을 그대로 쓰지 않는다.
        String fileName = UUID.randomUUID() + "." + extension;

        // S3 업로드 요청
        // 이 버킷에, 이 이름으로, 파일을 이런 타입으로 , 올리세요
        // 하고 주문서를 작성
        PutObjectRequest putObjectRequest =
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(fileName)
                        .contentType(contentType)
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

        // [보안] base64 헤더에 적힌 MIME 도 화이트리스트로 검증하고, 확장자는 서버가 결정한다.
        String extension = requireAllowedExtension(mimeType);

        byte[] imageBytes = java.util.Base64.getDecoder().decode(imageData);
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
