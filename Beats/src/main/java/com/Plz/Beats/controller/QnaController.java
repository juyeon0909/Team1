package com.Plz.Beats.controller;

import com.Plz.Beats.dto.QnaDto;
import com.Plz.Beats.dto.QnaRequestDto;
import com.Plz.Beats.service.QnaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/mypage/qna") // 👈 경로도 qnas로 직관적으로 변경 (필요시 기존대로 유지 가능)
@RequiredArgsConstructor
public class QnaController {

    private final QnaService qnaService; // 👈 QnaService로 변경

    // 문의 등록
    @PostMapping
    public ResponseEntity<?> submitQna(@RequestBody QnaRequestDto dto, Principal principal) {
        // principal.getName()을 통해 로그인한 유저의 email 혹은 username을 가져옵니다.
        qnaService.submitQna(principal.getName(), dto);
        return ResponseEntity.ok("문의가 등록되었습니다.");
    }

    // 내 QNA 목록 조회
    @GetMapping
    public ResponseEntity<List<QnaDto>> getMyQna(Principal principal) {
        return ResponseEntity.ok(qnaService.getMyQna(principal.getName()));
    }
}