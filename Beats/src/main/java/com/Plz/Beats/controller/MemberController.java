package com.Plz.Beats.controller;

import com.Plz.Beats.config.JwtTokenProvider;
import com.Plz.Beats.dto.LoginDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.service.MemberService;
import com.Plz.Beats.dto.LoginDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService ;

    private final AuthenticationManager authenticationManager ;
    private final JwtTokenProvider jwtTokenProvider ;

    @PostMapping("/login")
    // LoginDto의 데이터를 객체에 담으려고 @RequestBody 작성
    // Long타입과 String타입을 동시에 만족하는 타입은 Object타입이여서 Object타입도 적음
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginDto dto){
        // 인증 처리
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        dto.getEmail(),
                        dto.getPassword()
                )
        );


        // 사용자 정보 조회
        Member member = memberService.findByEmail(dto.getEmail());

        if(member == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "사용자 정보를 찾을 수 없습니다."));
        }else{
            // JWT 토큰 생성하기
            String token = jwtTokenProvider.createToken(member);

            // 응답
            return ResponseEntity.ok(Map.of("accessToken", token, "id", member.getId(),
                    "name", member.getName(), "email", member.getEmail(),
                    "role", member.getRole().toString())) ;
        }


    }

    // @RequestBody : 넘어온 request정보가 JSON형식인데 그것을 Java 형식으로 바꿔주는 것
    // 원래 VSC(React-프론트앤드)에서 넘어온 데이터는 bean.getName같은거에 있음
    // Controller까지는 그대로의 데이터이고 그 이후인 Service에서 암호화를 하든 말든 함
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody Member bean, BindingResult bindingResult){ // 회원 가입하기
        System.out.println("회원 가입 정보");
        System.out.println(bean);

        if(bindingResult.hasErrors()){ // 가입에 뭔가 문제 있음
            Map<String, String> errors = new HashMap<>();
            for(FieldError xx : bindingResult.getFieldErrors()){ // Field : Java에서의 변수 (name, password 등)
                errors.put(xx.getField(), xx.getDefaultMessage());
            }
            System.out.println(errors);
            return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
        }else{
            System.out.println("ok");
        }

        // 이메일 중복 체크
        Member member = memberService.findByEmail(bean.getEmail());
        if (member != null){ // member가 null이 아니라는 것은 이미 존재하는 id(맴버)라는 것을 의미함
            // 이미 존재하는 이메일 주소
            return new ResponseEntity<>(Map.of("email", "이미 존재하는 이메일 주소입니다."),
                    HttpStatus.BAD_REQUEST);
        }

        // 회원 가입 처리
        memberService.insert(bean);
        return new ResponseEntity<>("회원 가입 성공", HttpStatus.OK) ; // 회원 가입 성공 (OK라는건 200번대라는 뜻)
    }
}
