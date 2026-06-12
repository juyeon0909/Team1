package com.Plz.Beats.service;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class ResetPasswordService {

    private final MemberRepository memberRepository;
    private final MailService mailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final Map<String, String[]> verificationStorage = new ConcurrentHashMap<>();

    private static final long EXPIRED_TIME = 3 * 60 * 1000L; //3분

    public void verifyIdentityAndSendCode(String name, String email) {
        if (!memberRepository.existsByNameAndEmail(name, email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "일치하는 회원 정보가 없습니다.");
        }
        String randomCode = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        String currentTime = String.valueOf(System.currentTimeMillis());
        verificationStorage.put(email, new String[]{randomCode, currentTime});
        String subject = "[잇츠 인 마이 냉장고] 비밀번호 재설정 인증번호입니다.";
        String body = "안녕하세요. 냉장고 관리 서비스입니다.\n\n" +
                "비밀번호 재설정을 위한 인증번호 6자리는 다음과 같습니다.\n" +
                "인증번호 : [" + randomCode + "]\n\n" +
                "유효시간은 3분입니다. 화면으로 돌아가 인증번호를 정확히 입력해 주세요.";
        mailService.sendMail(email, subject, body);
    }
    public void verifyAuthenticationCode(String email, String userInputCode) {
        String[] authData = verificationStorage.get(email);

        if (authData == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 요청 정보가 없거나 만료되었습니다.");
        }

        String realCode = authData[0];
        long sentTime = Long.parseLong(authData[1]); // 발급된 시간 정보 추출
        long currentTime = System.currentTimeMillis(); // 검증하는 지금 이 순간의 시간

        // 🌟시간 검증
        if (currentTime - sentTime > EXPIRED_TIME) {
            verificationStorage.remove(email); // 만료되었으니 가방에서 폐기처리
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 유효시간(3분)이 초과되었습니다. 다시 인증번호를 받아주세요.");
        }

        // 인증번호 번호 매칭 검증
        if (!realCode.equals(userInputCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증번호가 올바르지 않습니다.");
        }

        verificationStorage.remove(email);
    }




    // 2. 초기화 (다시 한 번 일치 확인 후 변경)
    @Transactional
    public void resetPassword(String name, String email, String newPassword) {
        if (!memberRepository.existsByNameAndEmail(name, email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "일치하는 회원 정보가 없습니다.");
        }
        memberRepository.updatePasswordByNameAndEmail(name, email, passwordEncoder.encode(newPassword));
    }
}
/* 커 밋 체크 */