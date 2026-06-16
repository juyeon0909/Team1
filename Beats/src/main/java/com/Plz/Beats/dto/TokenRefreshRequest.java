package com.Plz.Beats.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 클라이언트가 access token 재발급을 요청할 때 보내는 요청 본문.
 * 예) POST /api/member/refresh  Body: { "refreshToken": "..." }
 *
 * 역직렬화(JSON -> 객체)를 위해 기본 생성자와 setter가 필요하다.
 */
@Getter
@Setter
@NoArgsConstructor
public class TokenRefreshRequest {
    private String refreshToken;
}
