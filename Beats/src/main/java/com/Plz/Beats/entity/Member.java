package com.Plz.Beats.entity;

import com.Plz.Beats.constant.Role;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

// 회원 1명을 의미하는 엔터티 클래스
@Getter @Setter @ToString @Entity
@Table(name = "members")
public class Member {
    // 밑에 어노테이션 3개는 바로 밑에 변수에만 적용됨
    @Id // 프라이머리 키
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 숫자 생성할때 AUTO로 생성하겠다.

    @Column(name = "member_id") // pk 컬럼 이름 : 테이블단수명_id
    private Long id ;

    @NotBlank(message = "이름은 필수 입력 사항입니다.") // 빈칸으로 두면 안되게 설정하고 텍스트를 표시함(데이터베이스의 제약조건느낌)
    private String name ;

    @Column(unique = true, nullable = false) // 실질적인 프라이머리 키
    @NotBlank(message = "이메일은 필수 입력 사항입니다.") // 빈칸으로 두면 안되게 설정하고 텍스트를 표시함(데이터베이스의 제약조건느낌)
    @Email(message = "올바른 이메일 형식으로 입력해 주셔야 합니다.") // 이메일 형식인지 아닌지 검사하는 것 / 틀리면 메시지 출력
    private String email ;

    @NotBlank(message = "비밀 번호는 필수 입력 사항입니다.") // 빈칸으로 두면 안되게 설정하고 텍스트를 표시함(데이터베이스의 제약조건느낌)
    @Size(min = 8, max = 255, message = "비밀 번호는 8자리 이상, 255자리 이하로 입력해 주세요.") // 비밀번호의 사이즈 입력 조건 / 틀리면 메시지 출력
    @Pattern(regexp = ".*[A-Z].*", message = "비밀 번호는 대문자 1개 이상을 포함해야 합니다.")
    @Pattern(regexp = ".*[!@#$%].*", message = "비밀 번호는 특수 문자 '!@#$%' 중 하나 이상을 포함해야 합니다.")
    private String password ;

    @NotBlank(message = "주소는 필수 입력 사항입니다.") // 빈칸으로 두면 안되게 설정하고 텍스트를 표시함(데이터베이스의 제약조건느낌)
    private String address ;

    @Enumerated(EnumType.STRING) // 나열, 열거하다 (아까 USER, ADMIN 열거)
    private Role role; // 일반인 또는 관리자

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate regdate ; // 등록 일자

    @Column(columnDefinition = "LONGTEXT")
    private String profileimage;
}