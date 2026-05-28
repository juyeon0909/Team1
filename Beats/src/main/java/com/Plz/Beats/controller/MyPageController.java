package com.Plz.Beats.controller;

import com.Plz.Beats.dto.*;
import com.Plz.Beats.service.MyPageService; // MyPageService 사용
import com.Plz.Beats.service.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/mypage") // 👈 깔끔하게 베이스 경로 정의
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService; // 👈 알맞은 서비스 주입
    private final S3Service s3Service;

    //프로필 조회
    @GetMapping("/info")
    public ResponseEntity<MemberInfoDto> getMyInfo(Principal principal) {
        System.out.println(">>> getMyInfo 컨트롤러 실행됨");
        String email = principal.getName();
        MemberInfoDto memberInfo = myPageService.getMemberInfo(email); // 오타 수정 완료
        return ResponseEntity.ok(memberInfo);
    }

    //프로필 이미지 변경
    @PostMapping("/update-profileimage")
    public ResponseEntity<?> updateProfileImage(
            @RequestBody ProfileImageDto request,
            Principal principal) {
        try {
            String email = principal.getName();
            log.info(">>> 프로필 이미지 업로드 시작: {}", email);
            String imageUrl = s3Service.uploadBase64(request.getProfileimage());
            log.info(">>> S3 업로드 완료: {}", imageUrl);
            myPageService.updateProfileImage(email, imageUrl);
            return ResponseEntity.ok().body(imageUrl);
        } catch (Exception e) {
            log.error(">>> 프로필 이미지 업로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("이미지 업로드 실패: " + e.getMessage());
        }
    }

    //이름 변경
    @PostMapping("/update-name")
    public ResponseEntity<?> updateName(
            @RequestBody NameUpdateDto updateDto,
            Principal principal) {
        String email = principal.getName();
        myPageService.updateName(email, updateDto.getNewName());
        return ResponseEntity.ok().body("이름이 성공적으로 변경되었습니다.");
    }

    //비밀번호 변경
    @PostMapping("/update-password") // 👈 중복 주소 제거하여 정확히 매핑
    public ResponseEntity<?> updatePassword(
            @RequestBody PasswordUpdateDto updateDto,
            Principal principal) {
        String email = principal.getName();
        myPageService.updatePassword(email, updateDto.getCurrentPassword(), updateDto.getNewPassword());
        return ResponseEntity.ok().body("비밀번호가 성공적으로 변경되었습니다.");
    }

}