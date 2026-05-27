package com.Plz.Beats.service;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

import java.util.Map;

// 일회용 복호화 토큰 만들기
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordlessService {

    private final MemberRepository memberRepository;
    private final RestTemplate restTemplate = new RestTemplate(); // Bean으로 등록해두셨다면 주입받아 쓰셔도 됩니다.


    @Value("${passwordless.server-url}")
    private String serverUrl;

    /**
     * 1. 사용자 등록 여부 확인 (isAp)
     *
     * @param email 사용자의 이메일 (인증 서버의 userId로 사용됨)
     * @return 등록되어 있으면 true, 아니면 false
     */
    public boolean checkIsAp(String email) {
        String url = serverUrl + "/ap/rest/auth/isAp";

        // x-www-form-urlencoded 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // db에서 회원 정보 찾아오기
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }

        // 이메일을 꺼내서 매핑하기
        // 바디 데이터 세팅 (userId 파라미터에 우리의 email을 넣습니다!)
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", member.getEmail());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            // 응답 데이터 로그 확인
            log.info("isAp response: {}", responseBody);

            // 성공 여부(result)가 Y이면 등록된 사용자
            return responseBody != null && "Y".equals(responseBody.get("result"));
        } catch (Exception e) {
            log.error("isAp API 호출 중 에러 발생", e);
            return false;
        }
    }

    // QR 등록 정보 요청
    public Map<String, Object> requestJoinAp(String email) {
        Member member = memberRepository.findByEmail(email).orElse(null);
        if (member == null) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }
        String url = serverUrl + "/ap/rest/auth/joinAp";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", member.getEmail()); // 이메일을 아이디로!
        body.add("name", member.getName());    // 엔티티의 이름
        body.add("email", member.getEmail());  // 엔티티의 이메일

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<String, Object> responseBody = response.getBody();

        log.info("joinAp response: {}", responseBody);

        // 여기서 리턴된 data 안의 'qr' (Base64 이미지 문자열)을
        // 리액트 프론트엔드로 보내주면 <img> 태그로 띄울 수 있습니다.
        return (Map<String, Object>) responseBody.get("data");
    }


    private String decryptAes128Cbc(String encryptedToken, String serverKey) throws Exception {
        // 1. 서버 키를 바이트 배열로 변환 (AES-128은 반드시 16바이트(16글자)여야 합니다)
        byte[] keyBytes = serverKey.getBytes(StandardCharsets.UTF_8);

        // 2. 비밀키(SecretKey)와 초기화 벡터(IV) 생성
        // (강사님 API 스펙상 Key와 IV가 동일하다고 되어 있습니다)
        SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(keyBytes);

        // 3. 자바에 내장된 AES/CBC/PKCS5Padding 복호화 기계 세팅
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

        // 4. Base64로 인코딩된 토큰을 먼저 바이트로 풀고(디코딩), 복호화 기계에 넣고 돌리기
        // (URL-safe Base64 문자인 -, _ 를 표준인 +, / 로 치환해주는 안전장치 포함)
        String safeToken = encryptedToken.replace("-", "+").replace("_", "/");
        byte[] decodedBytes = Base64.getDecoder().decode(safeToken);

        byte[] decryptedBytes = cipher.doFinal(decodedBytes);

        // 5. 풀려난 진짜 암호를 문자열로 바꿔서 리턴!
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }

    @Value("${passwordless.server-key}")
    private String serverKey; // yml에 설정한 16자리 서버키

    //3. 암호화된 일회용 토큰 요청 및 복호화 (getTokenForOneTime)
    public String getDecryptedToken(String email) {
        String url = serverUrl + "/ap/rest/auth/getTokenForOneTime";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 바디 세팅 (이번에도 역시 우리의 이메일을 userId 자리에 넣습니다)
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        // 인증 서버에 토큰 요청!
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<String, Object> responseBody = response.getBody();

        if (responseBody == null || responseBody.get("data") == null) {
            throw new RuntimeException("토큰을 받아오지 못했습니다.");
        }

        // 받아온 JSON에서 암호화된 토큰 꺼내기
        Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
        String encryptedToken = (String) data.get("token");

        try {
            // 아까 만든 만능열쇠 메서드로 복호화 진행!
            String decryptedToken = decryptAes128Cbc(encryptedToken, serverKey);
            log.info("복호화 성공! Decrypted Token: {}", decryptedToken);

            return decryptedToken;

        } catch (Exception e) {
            log.error("AES 복호화 중 에러 발생", e);
            throw new RuntimeException("토큰 복호화에 실패했습니다.", e);
        }
    }

    //인증 요청 (getSp) - 휴대폰으로 푸시 알림 전송
    public String requestSp(String email) {
        // 1. 위에서 만든 메서드로 암호화된 토큰을 받아와서 풉니다.
        String decryptedToken = getDecryptedToken(email);

        // 2. 포스트맨 스크립트가 하던 일(랜덤 값 생성)을 자바 코드로 구현합니다.
        String randomValue = java.util.UUID.randomUUID().toString().substring(0, 8); // 8자리 랜덤 문자열
        String sessionId = System.currentTimeMillis() + "-" + randomValue;
        String clientIp = "127.0.0.1"; // 원래는 접속한 유저 IP를 추출해야 하지만, 테스트용으로 임시 고정

        String url = serverUrl + "/ap/rest/auth/getSp";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 3. 바디 세팅 (5개의 파라미터를 꽉꽉 채워 넣습니다)
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);
        body.add("decryptedToken", decryptedToken);
        body.add("randomValue", randomValue);
        body.add("sessionId", sessionId);
        body.add("clientIp", clientIp);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        // 4. 인증 서버로 "이 사람 폰으로 알림 보내줘!" 요청
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<String, Object> responseBody = response.getBody();

        log.info("getSp(푸시 알림) response: {}", responseBody);

        // 5. 성공적으로 알림이 전송되었다면 randomValue를 리턴합니다.
        if (responseBody != null && "Y".equals(responseBody.get("result"))) {
            return randomValue;
        } else {
            throw new RuntimeException("모바일 푸시 알림 전송에 실패했습니다.");
        }
    }


    // 모바일 승인 여부 확인
    // 리액트가 api를 호출할 때 마다 확인하는 식으로 함.
    // 이렇게 하면 서버 과부화를 예방할 수 있을 뿐더러 1분동안 요청에 무리가 없음.
    public boolean checkApprovalResultOnce(String email, String randomValue) {
        String url = serverUrl + "/ap/rest/auth/result";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);
        body.add("randomValue", randomValue);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            // 딱 한 번만 인증 서버에 상태를 물어봅니다.
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                String authStatus = (String) data.get("auth");

                // 승인이 완료되었으면 true, 아니면 false를 즉시 리턴
                return "Y".equals(authStatus);
            }
            return false;
        } catch (Exception e) {
            log.error("result API 호출 중 에러 발생", e);
            return false;
        }
    }



    public boolean cancelAuth(String email, String randomValue) {
        String url = serverUrl + "/ap/rest/auth/cancel";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 취소할 대상(userId)과 취소할 요청번호(randomValue)를 담아 보냅니다.
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);
        body.add("randomValue", randomValue);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && "Y".equals(responseBody.get("result"))) {
                log.info("인증 취소 완료 (email: {})", email);
                return true;
            }
            return false;

        } catch (Exception e) {
            log.error("cancel API 호출 중 에러 발생", e);
            return false;
        }
    }




    // 해지요청을 받았을때
    public boolean withdrawAp(String email) {
        String url = serverUrl + "/ap/rest/auth/withdrawalAp";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 해지할 대상의 고유 ID(우리 프로젝트에서는 이메일)를 담습니다.
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && "Y".equals(responseBody.get("result"))) {
                log.info("패스워드리스 서비스 해지 완료 (email: {})", email);
                return true;
            }
            return false;

        } catch (Exception e) {
            log.error("withdrawalAp API 호출 중 에러 발생", e);
            return false;
        }
    }




}