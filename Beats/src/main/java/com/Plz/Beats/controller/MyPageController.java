package com.Plz.Beats.controller;

import com.Plz.Beats.dto.*;
import com.Plz.Beats.service.MyPageService; // MyPageService 사용
import com.Plz.Beats.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

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
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        try {
            String email = principal.getName();
            String imageUrl = s3Service.uploadFile(file); // S3 업로드 후 URL 반환
            myPageService.updateProfileImage(email, imageUrl);
            return ResponseEntity.ok().body(imageUrl); // URL을 프론트로 반환
        } catch (IOException e) {
            return ResponseEntity.status(500).body("이미지 업로드 실패");
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