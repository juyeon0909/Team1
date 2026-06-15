# eatsfridge.site 코드 보안 점검 결과

점검 대상: Spring Boot 백엔드(Beats) + React 프론트(Feats)
점검일: 2026-06-14

## 조치 현황 (2026-06-14 적용)

| 항목 | 상태 | 수정 파일 |
|------|------|-----------|
| CRITICAL 1 비밀번호 재설정 인증 강제 | ✅ 코드 수정 완료 | `service/ResetPasswordService.java` |
| HIGH 2 패스워드리스 해지 본인확인 | ✅ 코드 수정 완료 | `controller/PasswordlessController.java`, `Feats/.../PasswordlessWithdrawalPage.tsx` |
| MEDIUM 3 브루트포스 레이트리밋 | ⚙️ 인증번호 시도 5회 제한(코드) + nginx 설정 안내 | `ResetPasswordService.java`, `deploy/nginx-eatsfridge.conf` |
| MEDIUM 4 운영 DEBUG 로깅 | ✅ 코드 수정 완료 | `application-prod.properties` |
| MEDIUM 5 CORS 정리 | ✅ 코드 수정 완료 | `config/CorsConfig.java`, `controller/MemberController.java` |
| MEDIUM 6 업로드 형식 검증 | ✅ 코드 수정 완료 | `service/S3Service.java` |
| 외부 헤더/HSTS/CSP/CAA | ⚙️ 서버·DNS에 직접 적용 필요 | `deploy/nginx-eatsfridge.conf`, `deploy/SECURITY_FIXES.md` |

> ✅ = 코드 반영 완료(빌드·배포하면 적용) / ⚙️ = 서버·인프라에서 직접 적용 필요.
> 빌드 도구(Maven/JDK21)가 이 점검 환경에 없어 자동 컴파일은 못 했고, 변경 파일은
> 수동 검토로 구문·임포트·로직을 확인했다. 실제 배포 전 `mvn clean package`로 한 번
> 빌드 확인을 권장한다.

먼저 잘 되어 있는 부분부터: 비밀번호는 BCrypt로 해시 저장, 모든 DB 쿼리는
파라미터 바인딩(`:param`)을 써서 **SQL 인젝션은 없음**, 시크릿은 전부 환경변수로
분리되어 **하드코딩/커밋된 비밀키 없음**, 관리자 API는 권한 검사로 보호됨.
회원가입 시 `role`은 서버가 강제로 USER로 지정해 **권한 상승(mass assignment)도 차단**됨.

아래는 고쳐야 할 항목을 심각도 순으로 정리한 것이다.

---

## 🔴 CRITICAL 1 — 비밀번호 재설정으로 계정 탈취 가능

**위치:** `controller/ResetPasswordController.java` → `/api/member/reset-password/reset`
`service/ResetPasswordService.java` 의 `resetPassword()`

**문제:** 비밀번호 재설정은 원래 3단계로 설계되어 있다.
1. `/send` : 이름+이메일 확인 후 이메일로 인증번호 발송
2. `/verify-code` : 인증번호 일치 확인
3. `/reset` : 새 비밀번호로 변경

그런데 마지막 `/reset` 단계의 `resetPassword()`는 **이름과 이메일이 존재하는지만**
확인하고 곧바로 비밀번호를 바꾼다. **"인증번호 단계를 실제로 통과했는지"는 전혀
검사하지 않는다.**

```java
public void resetPassword(String name, String email, String newPassword) {
    if (!memberRepository.existsByNameAndEmail(name, email)) {   // ← 존재 여부만 확인
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "일치하는 회원 정보가 없습니다.");
    }
    memberRepository.updatePasswordByNameAndEmail(name, email, passwordEncoder.encode(newPassword));
}
```

즉 공격자가 피해자의 **이름과 이메일만 알면**(둘 다 추측·수집이 쉬움), `/send`·
`/verify-code`를 건너뛰고 `/reset`에 바로 요청을 보내 **아무 비밀번호로나 변경**할 수 있다.
이 엔드포인트는 SecurityConfig에서 `permitAll`(비로그인 허용)이라 인증도 필요 없다.
→ **임의 계정 탈취(Account Takeover)**.

**수정 방향:** 인증번호 검증 성공 사실을 서버가 기억하고, `/reset`에서 그걸 확인·소비하게 한다.

```java
// ResetPasswordService 안

// 인증 통과한 이메일을 "검증됨 + 만료시각"으로 잠깐 저장
private final Map<String, Long> verifiedEmails = new ConcurrentHashMap<>();
private static final long VERIFIED_TTL = 10 * 60 * 1000L; // 10분

public void verifyAuthenticationCode(String email, String userInputCode) {
    // ... 기존 코드 검증 로직 ...
    verificationStorage.remove(email);
    verifiedEmails.put(email, System.currentTimeMillis() + VERIFIED_TTL); // ★ 검증됨 표시
}

@Transactional
public void resetPassword(String name, String email, String newPassword) {
    // ★ 인증번호 단계를 실제로 통과했는지 확인
    Long deadline = verifiedEmails.get(email);
    if (deadline == null || deadline < System.currentTimeMillis()) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이메일 인증을 먼저 완료해주세요.");
    }
    if (!memberRepository.existsByNameAndEmail(name, email)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "일치하는 회원 정보가 없습니다.");
    }
    memberRepository.updatePasswordByNameAndEmail(name, email, passwordEncoder.encode(newPassword));
    verifiedEmails.remove(email); // ★ 1회용으로 소비
}
```

> 참고: 현재 인증 상태가 서버 메모리(`ConcurrentHashMap`)에 저장돼 있어, 서버를
> 여러 대로 늘리거나 재시작하면 인증 상태가 사라진다. 운영을 키우면 Redis 같은
> 공유 저장소로 옮기는 것을 권장한다.

---

## 🟠 HIGH 2 — 인증 없는 패스워드리스 해지/요청 (계정 보안 약화·푸시 스팸)

**위치:** `controller/PasswordlessController.java` (`/api/passwordless/**`, 전부 permitAll)

`withdrawal`, `register`, `getSp`, `check-status` 등은 **이메일을 파라미터로만 받고
본인 여부를 확인하지 않는다.**

```java
@PostMapping("/withdrawal")
public ResponseEntity<Boolean> withdrawAp(@RequestParam String email) {  // ← 누구의 이메일이든 가능
    boolean isWithdrawn = passwordlessService.withdrawAp(email);
    return ResponseEntity.ok(isWithdrawn);
}
```

문제점:
- `withdrawal` : 공격자가 피해자 이메일로 호출 → 피해자의 **패스워드리스(2차 보호)를
  임의로 해지** 가능. 보안 수준을 강제로 낮춰 비밀번호 로그인으로 떨어뜨린다.
- `getSp`/`register` : 피해자 이메일로 반복 호출 → **모바일 푸시 알림 스팸**.
- `check-status` : 특정 이메일의 가입/등록 여부가 노출(계정 존재 여부 확인).

**수정 방향:** 이메일을 파라미터로 받지 말고, 로그인된 사용자의 토큰(`Principal`)에서
이메일을 꺼내 쓴다. 최소한 `withdrawal`은 인증 필수로 바꾸고 본인만 가능하게 한다.

```java
@PostMapping("/withdrawal")
public ResponseEntity<Boolean> withdrawAp(Principal principal) {
    if (principal == null) return ResponseEntity.status(401).build();
    return ResponseEntity.ok(passwordlessService.withdrawAp(principal.getName()));
}
```

(로그인 전에 호출해야 하는 `check-status` 등은, 응답을 최소화하고 뒤의 레이트리밋을 적용.)

---

## 🟡 MEDIUM 3 — 브루트포스 방어(레이트리밋) 없음

**위치:** 로그인(`/api/member/login`), 재설정 인증번호(`reset-password/*`),
패스워드리스 폴링(`check-result`)

로그인 실패나 인증번호 시도 횟수에 제한이 없다. 인증번호는 6자리 숫자(100만 가지)이고
유효시간 3분인데, 시도 제한이 없으면 자동화 공격으로 추측될 수 있다.

**수정 방향:** IP·계정 단위로 시도 횟수를 제한한다(예: 5회 실패 시 일정 시간 잠금).
앞단 nginx의 `limit_req`로 1차 방어 + 애플리케이션에서 실패 카운트(예: Bucket4j,
또는 Redis 카운터)로 2차 방어. 인증번호도 3~5회 틀리면 폐기하도록 한다.

```nginx
# nginx http 블록 예시
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
# 로그인/리셋 location 안에서:
limit_req zone=login burst=5 nodelay;
```

---

## 🟡 MEDIUM 4 — 운영 환경에서 과도한 DEBUG 로깅

**위치:** `application.properties`

```properties
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.type.descriptor.sql=trace
```

`prod` 프로필이 `show-sql`은 꺼주지만, 위 두 줄(보안 필터 DEBUG, SQL 파라미터 trace)은
prod에서 덮어쓰지 않아 **운영 로그에 인증 흐름·SQL 바인딩 값 같은 민감 정보가 남을 수
있다.** 로그 유출 시 2차 피해로 이어진다.

**수정 방향:** `application-prod.properties`에 운영용 로그 레벨을 명시해 끈다.

```properties
# application-prod.properties 에 추가
logging.level.org.springframework.security=INFO
logging.level.org.hibernate.type.descriptor.sql=INFO
logging.level.org.hibernate.SQL=INFO
```

---

## 🟡 MEDIUM 5 — CORS 설정이 지나치게 느슨함

**위치:** `config/CorsConfig.java`

```java
configuration.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS","PATCH","*"));
configuration.setAllowedHeaders(List.of("Authorization","Content-Type","Accept","*"));
configuration.setAllowCredentials(true);
configuration.setAllowedOrigins(List.of(
        "http://localhost:5173", "https://localhost:3000",
        "https://eatsfridge.site", "https://54.180.0.163"));
```

문제점:
- 메서드·헤더 목록에 구체값과 `"*"`가 섞여 있다. `allowCredentials(true)`와 함께
  와일드카드를 쓰는 것은 의도가 모호하고 위험하다. 필요한 값만 명시할 것.
- 운영 허용 출처에 개발용 `localhost`와 **원시 IP(54.180.0.163)**가 들어 있다.
  운영에서는 실제 서비스 도메인만 남기는 게 안전하다.

**수정 방향:** 와일드카드 제거, 운영/개발 출처를 프로필로 분리.

```java
configuration.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
configuration.setAllowedHeaders(List.of("Authorization","Content-Type","Accept"));
configuration.setAllowedOrigins(List.of("https://eatsfridge.site","https://www.eatsfridge.site"));
```

---

## 🟡 MEDIUM 6 — 이미지 업로드 파일 형식 검증 없음 (저장형 XSS 가능성)

**위치:** `service/S3Service.java` (`uploadFile`, `uploadBase64`)

```java
.contentType(file.getContentType())          // ← 클라이언트가 보낸 값 그대로 신뢰
String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename(); // ← 원본 파일명 그대로
```

Content-Type과 파일명을 **클라이언트가 보낸 값 그대로** 사용한다. 확장자/MIME 화이트리스트가
없어, 공격자가 `image/svg+xml`이나 HTML을 업로드하면 S3 URL을 통해 브라우저에서
스크립트가 실행될 수 있다(저장형 XSS). 프로필/레시피 이미지 업로드는 로그인만 하면
가능하므로 현실적인 위협이다.

**수정 방향:** 허용 MIME/확장자(jpg, png, webp 등)만 통과시키고, 확장자도 서버가
직접 결정하며, 가능하면 이미지 실제 디코딩으로 검증한다. S3 객체는 `inline`이 아니라
`Content-Disposition: attachment` 또는 별도 이미지 도메인으로 서빙하는 것도 방법이다.

```java
private static final Set<String> ALLOWED = Set.of("image/jpeg","image/png","image/webp");
if (!ALLOWED.contains(file.getContentType())) {
    throw new IllegalArgumentException("허용되지 않은 이미지 형식입니다.");
}
```

---

## 🟢 LOW / 참고

- **로그인 fail-open:** `MemberController.login`에서 패스워드리스 서버 호출이 실패하면
  일반 로그인을 그대로 허용한다(주석: "장애 시 일반 로그인 허용"). 가용성과 보안의
  트레이드오프인데, 패스워드리스를 강제하려는 계정이라면 우회로가 될 수 있다.
- **`ddl-auto`:** 기본 프로필은 `update`지만 prod는 `validate`로 잘 잡혀 있음(양호).
  로컬에서만 `update`가 쓰이도록 유지할 것.
- **JWT:** 무상태(stateless) 설계라 로그아웃/탈취 토큰을 즉시 무효화할 수단이 없다.
  만료시간을 짧게 가져가고, 필요 시 블랙리스트(Redis) 도입 검토.
- **`@CrossOrigin(origins="http://localhost:5173")`** 이 `MemberController`에 하드코딩돼
  있다. CorsConfig와 중복·혼선을 주므로 제거 권장.

---

## 권장 처리 순서

1. **CRITICAL 1 (비밀번호 재설정)** — 즉시 수정. 실제 계정 탈취로 이어짐.
2. **HIGH 2 (패스워드리스 해지 인증)** — 빠르게 수정.
3. MEDIUM 3~6 — 차례로 적용.
4. LOW/참고 — 여유 있을 때 정리.

> 별도 파일 `SECURITY_FIXES.md`(헤더/HSTS/CSP/CAA)와 함께 적용하면
> 외부 스캔 등급과 실제 코드 보안을 동시에 끌어올릴 수 있다.
