// API 호출 실패 시 사용자에게 "실패 사유"를 모달(AlertModal)로 보여주는 공통 헬퍼.
//
// 동작 원리
//  1) 전달받은 error를 콘솔에 그대로 남긴다(개발자 디버깅용).
//  2) 서버가 내려준 구체적 메시지(error.response.data.message 등)가 있으면 우선 사용한다.
//  3) 메시지가 없으면 호출부에서 넘긴 fallback 문구를 쓴다.
//  4) 최종 문구를 triggerAlert로 전달해 AlertModal 팝업으로 띄운다.
//
// 참고: axiosInstance 인터셉터가 401/403/404/409/500/네트워크 오류는 이미 일반 메시지로
//       처리한다. 이 헬퍼는 그보다 더 구체적인 맥락 메시지로 덮어써서, 사용자가 어떤 작업이
//       왜 실패했는지 알 수 있게 한다.

import axios from "axios";
import { triggerAlert } from "./alertEvent";

/**
 * @param error   catch로 잡은 에러 객체
 * @param fallback 서버 메시지가 없을 때 보여줄 기본 문구 (예: "목록을 불러오지 못했습니다.")
 * @param title   모달 제목 (기본값 "오류")
 */
export const notifyError = (error: unknown, fallback: string, title = "오류"): void => {
    // 1) 항상 콘솔에 원본 에러를 남긴다.
    console.error(fallback, error);

    // 2) 기본값은 fallback 문구로 시작한다.
    let message = fallback;

    // 3) axios 에러인 경우에만 응답 본문에서 서버 메시지를 추출한다.
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        // 서버가 문자열을 그대로 줄 수도, { message: "..." } 형태로 줄 수도 있다.
        const serverMessage = typeof data === "string" ? data : data?.message;

        if (serverMessage) {
            // 구체적 사유가 있으면 기본 문구 아래에 괄호로 덧붙인다.
            message = `${fallback}\n(${serverMessage})`;
        } else if (!error.response) {
            // 응답 자체가 없으면 네트워크 단절로 간주한다.
            message = "서버에 연결할 수 없습니다.\n네트워크 상태를 확인해주세요.";
        }
    }

    // 4) 기존 전역 알림 시스템(AlertModal)으로 띄운다.
    triggerAlert(message, "error", title);
};
