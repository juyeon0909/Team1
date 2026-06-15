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

    // 이메일 → [인증번호, 발급시각] : 발송한 인증번호를 임시 보관하는 저장소
    private final Map<String, String[]> verificationStorage = new ConcurrentHashMap<>();

    // 이메일 → 남은 시도 횟수 : 인증번호를 몇 번 틀렸는지 세는 저장소 (브루트포스 방어)
    private final Map<String, Integer> attemptStorage = new ConcurrentHashMap<>();

    // 이메일 → 인증완료 만료시각(ms) : "이 이메일은 인증번호 단계를 통과했다"는 증표.
    // resetPassword()에서 이 값을 확인해야만 비밀번호를 바꿀 수 있게 한다(계정 탈취 방지).
    private final Map<String, Long> verifiedEmails = new ConcurrentHashMap<>();

    private static final long EXPIRED_TIME = 3 * 60 * 1000L; //3분
    private static final int  MAX_ATTEMPTS = 5;              // 인증번호 최대 시도 횟수
    private static final long VERIFIED_TTL = 10 * 60 * 1000L; // 인증완료 후 10분 안에 변경해야 함

    public void verifyIdentityAndSendCode(String name, String email) {
        if (!memberRepository.existsByNameAndEmail(name, email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "일치하는 회원 정보가 없습니다.");
        }
        String randomCode = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        String currentTime = String.valueOf(System.currentTimeMillis());
        verificationStorage.put(email, new String[]{randomCode, currentTime});
        // 새 인증번호를 보낼 때마다 시도 횟수를 초기화하고, 이전 인증완료 증표는 폐기
        attemptStorage.put(email, MAX_ATTEMPTS);
        verifiedEmails.remove(email);
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

        // 시간 검증
        if (currentTime - sentTime > EXPIRED_TIME) {
            verificationStorage.remove(email); // 만료되었으니 가방에서 폐기처리
            attemptStorage.remove(email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "인증 유효시간(3분)이 초과되었습니다. 다시 인증번호를 받아주세요.");
        }

        // 인증번호 번호 매칭 검증
        if (!realCode.equals(userInputCode)) {
            // 틀릴 때마다 남은 시도 횟수를 1 줄인다. 0이 되면 인증번호를 폐기해 무차별 대입을 막는다.
            int remaining = attemptStorage.getOrDefault(email, MAX_ATTEMPTS) - 1;
            if (remaining <= 0) {
                verificationStorage.remove(email);
                attemptStorage.remove(email);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "인증번호 입력 횟수를 초과했습니다. 다시 인증번호를 받아주세요.");
            }
            attemptStorage.put(email, remaining);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "인증번호가 올바르지 않습니다. (남은 횟수 " + remaining + "회)");
        }

        // 인증 성공: 인증번호는 폐기하고, "이 이메일은 인증을 통과했다"는 증표를 10분간 발급한다.
        verificationStorage.remove(email);
        attemptStorage.remove(email);
        verifiedEmails.put(email, System.currentTimeMillis() + VERIFIED_TTL);
    }




    // 2. 초기화 (인증 완료 여부 확인 → 일치 확인 → 변경)
    @Transactional
    public void resetPassword(String name, String email, String newPassword) {
        // ★ 핵심 방어: 이메일 인증번호 단계를 실제로 통과했는지 먼저 확인한다.
        // 이 검사가 없으면 인증 절차를 건너뛰고 이름+이메일만으로 비밀번호를 바꿀 수 있어
        // 계정 탈취가 가능해진다.
        Long deadline = verifiedEmails.get(email);
        if (deadline == null || deadline < System.currentTimeMillis()) {
            verifiedEmails.remove(email); // 만료된 증표는 정리
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "이메일 인증을 먼저 완료해 주세요. (인증 후 10분 이내에 변경해야 합니다.)");
        }

        if (!memberRepository.existsByNameAndEmail(name, email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "일치하는 회원 정보가 없습니다.");
        }
        memberRepository.updatePasswordByNameAndEmail(name, email, passwordEncoder.encode(newPassword));

        // 증표는 1회용: 비밀번호를 바꾸면 즉시 폐기해 재사용을 막는다.
        verifiedEmails.remove(email);
    }
}
/* 커 밋 체크 */