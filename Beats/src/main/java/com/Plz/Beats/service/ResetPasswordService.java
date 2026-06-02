package com.Plz.Beats.service;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ResetPasswordService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 1. 이름 + 이메일 일치 확인
    public void verifyIdentity(String name, String email) {
        if (!memberRepository.existsByNameAndEmail(name, email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "일치하는 회원 정보가 없습니다.");
        }
    }

    // 2. 초기화 (다시 한 번 일치 확인 후 변경)
    @Transactional
    public void resetPassword(String name, String email, String newPassword) {
        Member member = memberRepository.findByNameAndEmail(name, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "일치하는 회원 정보가 없습니다."));
        member.updatePassword(passwordEncoder.encode(newPassword));
    }
}