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

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// 일회용 복호화 토큰 만들기
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordlessService {

    private final MemberRepository memberRepository;
    private final RestTemplate restTemplate = new RestTemplate(); // Bean으로 등록해두셨다면 주입받아 쓰셔도 됩니다.

    // 인증 서버의 result API는 1회 소비형일 수 있으므로 승인 결과를 캐싱해 중복 조회 방지
    private final Map<String, Boolean> approvalCache = new ConcurrentHashMap<>();
    // getSp 때 사용한 decryptedToken을 result/cancel 호출 시 재사용하기 위해 저장
    private final Map<String, String> sessionTokenCache = new ConcurrentHashMap<>();


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

            log.info("isAp response: {}", responseBody);

            Object resultObj = responseBody != null ? responseBody.get("result") : null;
            return resultObj != null && (resultObj.equals(true) || "true".equals(String.valueOf(resultObj)) || "Y".equals(resultObj));
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
        body.add("secretKey", serverKey);  // 엔티티의 이메일

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            log.info("joinAp response: {}", responseBody);

            // 여기서 리턴된 data 안의 'qr' (Base64 이미지 문자열)을
            // 리액트 프론트엔드로 보내주면 <img> 태그로 띄울 수 있습니다.
            return (Map<String, Object>) responseBody.get("data");
        } catch (Exception e) {
            log.error("joinAp API 호출 중 에러 발생 (AP 서버 주소: {})", url, e);
            throw new RuntimeException("패스워드리스 인증 서버 호출에 실패했습니다: " + e.getMessage(), e);
        }
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
    public Map<String, String> requestSp(String email) {
        // 1. 암호화된 토큰 복호화
        String decryptedToken = getDecryptedToken(email);

        // 2. 랜덤 값 생성
        String randomValue = java.util.UUID.randomUUID().toString().substring(0, 8);
        String sessionId = System.currentTimeMillis() + "-" + randomValue;
        String clientIp = "127.0.0.1";

        String url = serverUrl + "/ap/rest/auth/getSp";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        // 3. 바디 세팅
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);
        body.add("token", decryptedToken);
        body.add("randomValue", randomValue);
        body.add("sessionId", sessionId);
        body.add("clientIp", clientIp);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        // 4. 인증 서버로 요청
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<String, Object> responseBody = response.getBody();

        log.info("getSp(푸시 알림) response: {}", responseBody);

        // 🌟 5. 핵심 수정: "Y"가 아니라 true(또는 "true")인지 확인합니다!
        Object resultObj = responseBody != null ? responseBody.get("result") : null;
        if (resultObj != null && (resultObj.equals(true) || "true".equals(String.valueOf(resultObj)))) {

            // 🌟 6. 리액트가 화면에 띄울 수 있도록 randomValue와 servicePassword를 묶어서 리턴!
            Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
            String servicePassword = String.valueOf(data.get("servicePassword"));

            // result/cancel 호출 시 재사용할 수 있도록 토큰 저장
            sessionTokenCache.put(randomValue, decryptedToken);

            Map<String, String> resultMap = new HashMap<>();
            resultMap.put("randomValue", randomValue);
            resultMap.put("servicePassword", servicePassword);

            return resultMap;
        } else {
            String code = responseBody != null ? String.valueOf(responseBody.get("code")) : "";
            if ("200.6".equals(code)) {
                throw new IllegalArgumentException("이미 진행 중인 인증 요청이 있습니다. 모바일 앱에서 승인하거나 취소 후 다시 시도해 주세요.");
            }
            throw new RuntimeException("모바일 푸시 알림 전송에 실패했습니다.");
        }
    }


    // 모바일 승인 여부 확인
    // 리액트가 api를 호출할 때 마다 확인하는 식으로 함.
    // 이렇게 하면 서버 과부화를 예방할 수 있을 뿐더러 1분동안 요청에 무리가 없음.
    public boolean checkApprovalResultOnce(String email, String randomValue) {
        String cacheKey = email + ":" + randomValue;

        // 이미 승인된 결과는 캐시에서 즉시 반환 (인증 서버 재조회 불필요)
        if (Boolean.TRUE.equals(approvalCache.get(cacheKey))) {
            return true;
        }

        String url = serverUrl + "/ap/rest/auth/result";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String sessionToken = sessionTokenCache.get(randomValue);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);
        body.add("randomValue", randomValue);
        if (sessionToken != null) {
            body.add("token", sessionToken);
        } else {
            body.add("secretKey", serverKey);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            log.info("result API 전체 응답: {}", responseBody);

            Object resultObj = responseBody != null ? responseBody.get("result") : null;
            if (resultObj != null && (resultObj.equals(true) || "true".equals(String.valueOf(resultObj)))) {
                approvalCache.put(cacheKey, true);
                sessionTokenCache.remove(randomValue);
                return true;
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

        String sessionToken = sessionTokenCache.remove(randomValue);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userId", email);
        body.add("randomValue", randomValue);
        if (sessionToken != null) {
            body.add("token", sessionToken);
        } else {
            body.add("secretKey", serverKey);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            log.info("cancel API 응답: {}", responseBody);

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