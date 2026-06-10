package com.Plz.Beats.service;

import com.Plz.Beats.dto.MemberInfoDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder; // 수입(import) 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder; 

    public Member findByEmail(String email){
        return memberRepository.findByEmail(email).orElse(null);
    }

    public Optional<Member> findMemberById(Long memberId){
        return this.memberRepository.findById(memberId);
    }

    // 회원 정보 조회
    public MemberInfoDto getMemberInfo(String email) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다. 이메일 : " + email);
        }
        return new MemberInfoDto(
                member.getName(),
                member.getProfileimage(),
                member.getEmail()
        );
    }

    @Transactional
    public void updateProfileImage(String email, String base64Image) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }
        member.setProfileimage(base64Image);
    }

    @Transactional
    public void updateName(String email, String newName) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("올바른 이름을 입력해 주세요.");
        }
        member.setName(newName);
    }

    // 회원 비밀번호 변경 로직
    @Transactional
    public void updatePassword(String email, String currentPassword, String newPassword) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }

        // 1. 패스워드 일치 검증 오류 수정
        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("새로운 비밀번호를 입력해 주세요.");
        }

        // 2. 새 비밀번호 암호화 후 인입
        String encodedPassword = passwordEncoder.encode(newPassword);
        member.setPassword(encodedPassword);
    }
}