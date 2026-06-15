# eatsfridge.site 보안 스캔 조치 가이드

SafeDomain 스캔(등급 D, 65점)에서 나온 경고 항목을 해결하기 위한 작업 정리.
지적된 문제는 코드 버그가 아니라 **서버(nginx) 응답 헤더**와 **DNS 레코드** 설정 누락이다.

| 항목 | 종류 | 고치는 위치 |
|------|------|-------------|
| HSTS 누락 | HTTP 헤더 | nginx |
| Content-Security-Policy 누락 | HTTP 헤더 | nginx |
| X-Content-Type-Options 누락 | HTTP 헤더 | nginx |
| X-Frame-Options 누락 | HTTP 헤더 | nginx |
| Referrer-Policy 누락 | HTTP 헤더 | nginx |
| DNS CAA 누락 | DNS 레코드 | 도메인/DNS 관리 콘솔 |

---

## 1단계. nginx 보안 헤더 적용

이 폴더의 `nginx-eatsfridge.conf` 가 헤더가 추가된 설정이다.
각 헤더가 무엇인지는 파일 안 주석에 한 줄씩 설명해 두었다.

### 적용 순서 (EC2에 SSH 접속 후)

```bash
# 1) 현재 쓰는 nginx 설정 파일 위치 확인
sudo nginx -T | grep -i "server_name eatsfridge" -n
#    보통 /etc/nginx/sites-available/eatsfridge 또는
#         /etc/nginx/conf.d/eatsfridge.conf 에 있다.

# 2) 원본 백업 (문제 생기면 되돌리기 위함)
sudo cp /etc/nginx/sites-available/eatsfridge /etc/nginx/sites-available/eatsfridge.bak

# 3) 파일을 열어 server { ... } 블록 안에,
#    nginx-eatsfridge.conf 의 "## 보안 헤더 시작 ##" ~ "## 보안 헤더 끝 ##"
#    부분을 그대로 붙여넣는다. (ssl_certificate, proxy_pass 등 기존 값은 유지)
sudo nano /etc/nginx/sites-available/eatsfridge

# 4) 문법 검사 — "syntax is ok / test is successful" 나와야 함
sudo nginx -t

# 5) 무중단 적용 (서비스 끊김 없음)
sudo systemctl reload nginx
```

> ACM(CloudFront/ALB가 앞단) 구조인 경우에도, 위 헤더를 nginx origin에
> 넣으면 CloudFront/ALB가 그대로 브라우저까지 전달하므로 그대로 동작한다.
> 더 깔끔하게 하려면 CloudFront의 "Response headers policy"에서
> HSTS·X-Frame-Options 등을 켜는 방법도 있다(선택).

### CSP는 처음엔 "관찰 모드"로 켜는 걸 권장

CSP는 잘못 설정하면 화면의 스크립트/스타일이 막혀 페이지가 깨질 수 있다.
처음에는 차단하지 않고 위반만 기록하는 `-Report-Only` 로 켜서 콘솔에
경고가 안 뜨는지 확인한 뒤, 문제없으면 진짜 `Content-Security-Policy` 로 바꾼다.

```nginx
# 테스트용: 차단하지 않고 브라우저 콘솔에 위반만 보고
add_header Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'" always;
```

브라우저 F12 → Console 에서 빨간 CSP 위반 경고가 없으면, `nginx-eatsfridge.conf`
에 있는 정식 `Content-Security-Policy` 줄로 교체한다.
(외부 폰트·분석 도구·결제 위젯 등을 쓴다면 그 도메인을 CSP에 추가해야 한다.)

---

## 2단계. DNS CAA 레코드 추가 (인증서 발급기관 제한)

CAA는 "이 도메인 인증서는 지정한 CA만 발급할 수 있다"고 못 박는 DNS 레코드다.
공격자가 다른 CA에서 몰래 인증서를 발급받는 것을 막는다.
인증서를 **AWS Certificate Manager(ACM)** 로 발급받고 있으므로 Amazon CA를 허용한다.

도메인을 관리하는 곳(가비아/Route 53/Cloudflare 등) DNS 설정에서
아래 CAA 레코드를 추가한다.

| Type | Name(호스트) | Flags | Tag | Value |
|------|--------------|-------|-----|-------|
| CAA  | @ (eatsfridge.site) | 0 | issue | `amazon.com` |
| CAA  | @ (eatsfridge.site) | 0 | issuewild | `amazon.com` |

레코드 텍스트(zone 파일) 형식으로는 다음과 같다:

```
eatsfridge.site.  IN  CAA  0 issue "amazon.com"
eatsfridge.site.  IN  CAA  0 issuewild "amazon.com"
```

- `issue` : 일반 인증서 발급 허용 CA 지정
- `issuewild` : 와일드카드(*.eatsfridge.site) 인증서 발급 허용 CA 지정
- ACM은 `amazon.com` 한 줄이면 충분하다. (필요 시 `amazontrust.com`,
  `awstrust.com`, `amazonaws.com` 도 같은 형식으로 추가 가능)

> 만약 ACM이 아니라 Let's Encrypt(certbot)도 같이 쓴다면
> `eatsfridge.site. IN CAA 0 issue "letsencrypt.org"` 줄도 추가해야
> 갱신이 막히지 않는다. 사용하는 CA는 빠짐없이 넣을 것.

---

## 3단계. 적용 확인 (검증)

설정을 reload 한 뒤, 헤더가 실제로 나오는지 확인한다.
(아래 명령은 본인 PC 터미널이나 EC2에서 실행)

```bash
# 헤더 확인 — 아래 5개 헤더가 응답에 모두 보이면 성공
curl -sI https://eatsfridge.site | grep -iE "strict-transport|content-security|x-content-type|x-frame|referrer"

# CAA 레코드 확인 — amazon.com 이 보이면 성공
dig CAA eatsfridge.site +short
```

온라인 도구로도 확인 가능:
- 헤더: https://securityheaders.com/?q=eatsfridge.site
- SSL/HSTS 종합: https://www.ssllabs.com/ssltest/analyze.html?d=eatsfridge.site

다 적용하면 누락 헤더 경고와 CAA 경고가 사라지고 점수/등급이 올라간다.

---

## (참고) 백엔드 쪽 추가 점검 — 선택 사항

스캔 범위 밖이지만 코드를 보다가 눈에 띈 부분:

- `SecurityConfig` 에서 `/api/member/delete` 가 `permitAll()` 로 열려 있다.
  회원 삭제는 보통 인증이 필요한 동작이라, 정말 비로그인 허용이 맞는지
  한번 확인해 보면 좋다. (의도된 것이면 무시)
- CSRF 비활성화는 JWT를 헤더로만 전달하는 구조라면 정상 선택이다.
