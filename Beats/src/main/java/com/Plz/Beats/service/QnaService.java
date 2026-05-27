package com.Plz.Beats.service;

import com.Plz.Beats.constant.QnaStatus;
import com.Plz.Beats.constant.QnaType;
import com.Plz.Beats.dto.AdminQnaDto;
import com.Plz.Beats.dto.QnaDto;
import com.Plz.Beats.dto.QnaRequestDto;
import com.Plz.Beats.entity.Qna;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.QnaRepository;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QnaService {

    private final QnaRepository qnaRepository;
    private final MemberRepository memberRepository;

    // 문의 등록
    public void submitQna(String email, QnaRequestDto dto) {
        Member member = memberRepository.findByEmail(email);
        if (member == null) throw new IllegalArgumentException("존재하지 않는 회원입니다.");

        Qna qna = new Qna();
        qna.setMember(member);
        qna.setQnaType(QnaType.valueOf(dto.getQnaType()));
        qna.setTitle(dto.getTitle());
        qna.setContent(dto.getContent());
        qnaRepository.save(qna);
    }

    // 특정 회원의 QNA 목록 조회
    public List<QnaDto> getMyQna(String email) {
        Member member = memberRepository.findByEmail(email);
        if (member == null) throw new IllegalArgumentException("존재하지 않는 회원입니다.");

        return qnaRepository.findByMemberOrderByCreatedAtDesc(member)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // 관리자용 전체 QNA 목록 조회
    public List<AdminQnaDto> getAllQna() {
        return qnaRepository.findAllByOrderByCreatedAtDesc() // qnaRepository 인스턴스 메서드로 수정
                .stream().map(this::toAdminDto).collect(Collectors.toList());
    }

    // 관리자 답변 등록
    @Transactional
    public void answerQna(Long id, String answer) {
        Qna qna = qnaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
        qna.setAnswer(answer);
        qna.setStatus(QnaStatus.ANSWERED); // QnaStatus 적용
        qna.setAnsweredAt(LocalDateTime.now());
    }

    // 사용자용 DTO 변환 매핑
    private QnaDto toDto(Qna q) {
        return new QnaDto(
                q.getId(),
                q.getQnaType().getDescription(), // QnaType 적용
                q.getTitle(),
                q.getContent(),
                q.getStatus().getDescription(), // QnaStatus 적용
                q.getAnswer(),
                q.getCreatedAt().toLocalDate().toString(),
                q.getAnsweredAt() != null ? q.getAnsweredAt().toLocalDate().toString() : null
        );
    }

    // 관리자용 DTO 변환 매핑
    private AdminQnaDto toAdminDto(Qna q) {
        return new AdminQnaDto(
                q.getId(),
                q.getMember().getName(),
                q.getMember().getEmail(),
                q.getQnaType().getDescription(), // QnaType 적용
                q.getTitle(),
                q.getContent(),
                q.getStatus().getDescription(), // QnaStatus 적용
                q.getAnswer(),
                q.getCreatedAt().toLocalDate().toString(),
                q.getAnsweredAt() != null ? q.getAnsweredAt().toLocalDate().toString() : null
        );
    }
}