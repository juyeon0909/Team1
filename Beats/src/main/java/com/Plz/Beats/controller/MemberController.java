package com.Plz.Beats.controller;

import com.Plz.Beats.config.JwtTokenProvider;
import com.Plz.Beats.dto.LoginDto;
import com.Plz.Beats.dto.MemberInfoResponse;
import com.Plz.Beats.dto.ProfileImageRequest;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.service.MemberDetailsService;
import com.Plz.Beats.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MemberController {
    private final MemberService memberService ;
    private final MemberDetailsService memberDetailsServices;
    private final JwtTokenProvider jwtTokenProvider ;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    // LoginDto의 데이터를 객체에 담으려고 @RequestBody 작성
    // Long타입과 String타입을 동시에 만족하는 타입은 Object타입이여서 Object타입도 적음
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginDto dto){

            // 1. 이메일로 유저 조회
            UserDetails userDetails;
            try {
                userDetails = memberDetailsServices.loadUserByUsername(dto.getEmail());
            } catch (UsernameNotFoundException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "이메일 또는 비밀번호가 올바르지 않습니다."));
            }

            // 2. 비밀번호 검증
            if (!passwordEncoder.matches(dto.getPassword(), userDetails.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "이메일 또는 비밀번호가 올바르지 않습니다."));
            }

            // 3. JWT 토큰 발급
            Member member = memberService.findByEmail(dto.getEmail());
            String token = jwtTokenProvider.createToken(member);

            return ResponseEntity.ok(Map.of(
                    "accessToken", token,
                    "id", member.getId(),
                    "name", member.getName(),
                    "email", member.getEmail(),
                    "role", member.getRole().toString()
            ));
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

    @GetMapping("/mypage/info")
    public ResponseEntity<MemberInfoResponse> getMyInfo(Principal principal){

        System.out.println(">>> getMyInfo 컨트롤러 실행됨"); // ← 추가
        String email = principal.getName();
        MemberInfoResponse memberInfo = memberService.getMemberInfo(email);

        return ResponseEntity.ok(memberInfo);
    }

    @PostMapping("/mypage/update-profileimage")
    public ResponseEntity<?> updateProfileImage(
            @RequestBody ProfileImageRequest request,
            Principal principal) {

        String email = principal.getName();

        // 서비스 레이어에서 이미지 업데이트 로직 수행
        memberService.updateProfileImage(email, request.getProfileimage());

        return ResponseEntity.ok().body("프로필 사진이 성공적으로 변경되었습니다.");
    }

    @PostMapping("/delete") // 🚨 다시 POST로 복구
    public ResponseEntity<?> deleteMember(@RequestBody Map<String, String> request, Principal principal) {

        String email = request.get("email");
        String password = request.get("password");

        // 로컬 콘솔창에 찍히는지 확인용
        System.out.println("로컬 테스트 요청 들어옴! 이메일: " + email + ", 비번: " + password);

        String targetEmail = (principal != null) ? principal.getName() : email;

        Member member = memberService.findByEmail(targetEmail);
        if (member == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원이 없습니다."));
        }

        if (!passwordEncoder.matches(password, member.getPassword())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "비밀번호 불일치"));
        }

        memberService.delete(member);
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 성공"));
    }


}
