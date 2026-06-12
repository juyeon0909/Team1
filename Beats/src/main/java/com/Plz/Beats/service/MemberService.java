package com.Plz.Beats.service;

import com.Plz.Beats.constant.Role;
import com.Plz.Beats.dto.MemberInfoResponse;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService { // MemberService가 MemberRepository를 의존하고 있음
    private final MemberRepository memberRepository; // final로 선언하여 불변성을 보장하고, @RequiredArgsConstructor로 생성자 자동 생성

    public Member findByEmail(String email){
        return memberRepository.findByEmail(email).orElse(null);
    }

    @Autowired // 필드 주입 : 맴버 변수에 직접 의존성을 주입하는 방식
    private PasswordEncoder passwordEncoder ;


// 회원 가입
    public void insert(Member bean){
        // 회원 가입한 사용자의 역할과 등록 일자는 여기서 설정
        bean.setRole(Role.USER);
        bean.setRegdate(LocalDate.now());

        String encodedPassword = passwordEncoder.encode(bean.getPassword());
        bean.setPassword(encodedPassword);

        memberRepository.save(bean);
    }

// 회원 정보 조회 (ID로)
    public Optional<Member> findMemberById(Long memberId){
        return this.memberRepository.findById(memberId);
    }


    // 회원 정보 조회
    public MemberInfoResponse getMemberInfo(String email) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다. 이메일 : " + email);
        }

        // 조회한 엔터티 데이터를 DTO에 담아서 반환
        return new MemberInfoResponse(
                member.getName(),
                member.getProfileimage(),
                member.getEmail()
        );
    }

// 회원 프로필 이미지 업데이트
    @Transactional
    public void updateProfileImage(String email, String base64Image) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }
        member.setProfileimage(base64Image);
    }

// 회원 강제 탈퇴
    @Transactional
    public void delete(Member member) {
        if (member == null) {
            throw new IllegalArgumentException("삭제하려는 회원 정보가 null입니다.");
        }

        Long memberId = member.getId();

        memberRepository.deleteRecipeLikesByMemberId(memberId);
        memberRepository.deleteScrapsByMemberId(memberId);
        memberRepository.deleteQnasByMemberId(memberId);
        memberRepository.nullifyRecipeMemberByMemberId(memberId);
        memberRepository.deleteStorageItemsByMemberId(memberId);

        memberRepository.delete(member);
    }

}
