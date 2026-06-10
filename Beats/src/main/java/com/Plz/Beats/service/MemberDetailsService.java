package com.Plz.Beats.service;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring Security가 로그인 인증 시 사용자 정보를 조회하기 위해 호출하는 서비스.
 *
 * [왜 필요한가]
 * Spring Security의 AuthenticationManager는 사용자 정보(이메일, 비밀번호, 권한)를
 * 직접 DB에서 조회하는 방법을 모른다. UserDetailsService 인터페이스를 구현한 Bean을
 * 제공하면, SecurityConfig의 DaoAuthenticationProvider가 인증 시 이 클래스를 사용해
 * DB에서 사용자를 조회하고 비밀번호를 검증한다.
 *
 * [언제 호출되는가]
 * MemberController의 로그인 엔드포인트에서
 * authenticationManager.authenticate(UsernamePasswordAuthenticationToken)을 호출할 때
 * 내부적으로 DaoAuthenticationProvider → loadUserByUsername() 순서로 자동 호출된다.
 * 직접 이 메서드를 호출하는 코드를 작성하지 않아도 된다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    /**
     * 이메일로 DB에서 회원을 조회하고 Spring Security가 사용하는 UserDetails 객체로 변환한다.
     *
     * [메서드명이 loadUserByUsername인 이유]
     * UserDetailsService 인터페이스의 메서드명이 loadUserByUsername()으로 고정되어 있다.
     * Spring Security 내부에서 이 인터페이스를 통해 사용자를 조회하므로,
     * 파라미터 이름은 username이지만 이 프로젝트에서는 이메일을 사용자 식별자로 쓴다.
     *
     * [UsernameNotFoundException을 던지는 이유]
     * UserDetailsService 계약상 사용자를 찾지 못하면 이 예외를 던져야 한다.
     * DaoAuthenticationProvider가 이 예외를 잡아 BadCredentialsException으로 변환하고
     * 로그인 실패 응답을 반환한다.
     *
     * [반환값 UserDetails 구조]
     * - username : Spring Security 인증 객체의 principal로 사용되는 식별자 (여기선 이메일)
     * - password : DaoAuthenticationProvider가 입력 비밀번호와 BCrypt 비교할 DB 해시값
     * - roles    : "ROLE_" 접두사를 자동으로 붙여 GrantedAuthority 목록을 생성한다.
     *              예) role = "USER" → GrantedAuthority = "ROLE_USER"
     *
     * @param email 로그인 시 입력된 이메일 (Spring Security가 "username" 파라미터로 전달)
     * @return Spring Security 인증에 필요한 사용자 정보 객체
     * @throws UsernameNotFoundException 해당 이메일의 회원이 DB에 없을 때
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("사용자 조회 시도: {}", email);

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "이메일이 " + email + "인 회원은 존재하지 않습니다."
                ));

        log.debug("사용자 조회 완료: {}", member.getEmail());

        // User.builder()는 Spring Security가 제공하는 UserDetails 구현체 생성 유틸.
        // roles()에 "ADMIN"을 넘기면 내부적으로 "ROLE_ADMIN" GrantedAuthority가 생성된다.
        return User.builder()
                .username(member.getEmail())
                .password(member.getPassword())
                .roles(member.getRole().name())
                .build();
    }
}
