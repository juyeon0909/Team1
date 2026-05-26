package com.Plz.Beats.service;

import com.Plz.Beats.constant.Role;
import com.Plz.Beats.dto.MemberInfoResponse;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.endpoints.internal.Value;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService { // MemberService가 MemberRepository를 의존하고 있음
    private final MemberRepository memberRepository; // 의존 + 무의미한 데이터여서 주입(injection)해야 함 + final로 변경

    public Member findByEmail(String email){
        return memberRepository.findByEmail(email);
    }

    @Autowired // 필드 주입 : 맴버 변수에 직접 의존성을 주입하는 방식
    private PasswordEncoder passwordEncoder ;


    public void insert(Member bean){
        // 회원 가입한 사용자의 역할과 등록 일자는 여기서 설정
        bean.setRole(Role.USER);
        bean.setRegdate(LocalDate.now());

        String encodedPassword = passwordEncoder.encode(bean.getPassword());
        bean.setPassword(encodedPassword);

        memberRepository.save(bean);
    }


    public Optional<Member> findMemberById(Long memberId){
        return this.memberRepository.findById(memberId);
    }


    // 회원 정보 조회
    public MemberInfoResponse getMemberInfo(String email) {
        // 이메일로 회원 조회(없으면 예외 발생)
        Member member = memberRepository.findByEmail(email);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다. 이메일 : " + email);
        }

        //조회한 엔터티 데이터를 DTO에 담아서 반환
        return new MemberInfoResponse(
                member.getName(),
                member.getProfileimage(),
                member.getEmail()
        );
    }

    @Transactional
    public void updateProfileImage(String email, String base64Image) {
        Member member = memberRepository.findByEmail(email);
        if (member == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다.");
        }

        // 엔티티의 필드 값을 변경 (더티 체킹에 의해 자동으로 DB에 반영됨)
        member.setProfileimage(base64Image);
    }


    // MemberService.java 내부 수정
    @Transactional
    public void delete(Member member) {
        if (member == null) {
            throw new IllegalArgumentException("삭제하려는 회원 정보가 null입니다.");
        }

        System.out.println("🎯 회원 강제 탈퇴 로직 가동. ID: " + member.getId());

        // 1. 자식 테이블(storage_items) 데이터 먼저 직접 강제 삭제!
        memberRepository.deleteStorageItemsByMemberId(member.getId());
        System.out.println("-> 자식 테이블(storage_items) 데이터 청소 완료.");

        // 2. 부모 테이블(members) 데이터 최종 삭제!
        memberRepository.delete(member);
        System.out.println("-> 부모 테이블(members) 회원 삭제 완료.");
    }

}
