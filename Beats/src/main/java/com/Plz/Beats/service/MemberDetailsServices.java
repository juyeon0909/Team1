package com.Plz.Beats.service;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberDetailsServices implements UserDetailsService {
    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("email");
        System.out.println(email);
        Member member = memberRepository.findByEmail(email);

        if(member == null) {
            String message = "이메일이" + email + "인 회원은 존재하지 않습니다.";
            //자바에서 사용자가 예외를 발생시키고자 하는 경우에는 throw 키워드를 사용합니다.
            throw new UsernameNotFoundException(message);
        }else{
            System.out.println("loadUserbyUsername() 메소드");
            System.out.println(member);
        }
        return User.builder()
                .username(member.getEmail())
                .password(member.getPassword())
                .roles(member.getRole().name())
                .build();
    }
}
