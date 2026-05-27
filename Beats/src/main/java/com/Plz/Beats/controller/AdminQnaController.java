package com.Plz.Beats.controller;

import com.Plz.Beats.dto.AdminAnswerDto;
import com.Plz.Beats.dto.AdminQnaDto;
import com.Plz.Beats.service.QnaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/qnas")
@RequiredArgsConstructor
public class AdminQnaController {

    private final QnaService qnaService;

    @GetMapping
    public ResponseEntity<List<AdminQnaDto>> getAll() {
        return ResponseEntity.ok(qnaService.getAllQna());
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<?> answer(@PathVariable Long id, @RequestBody AdminAnswerDto dto) {
        qnaService.answerQna(id, dto.getAnswer());
        return ResponseEntity.ok("답변이 등록되었습니다.");
    }
}