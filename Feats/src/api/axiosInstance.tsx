// 로그인 인증(JWT)을 자동으로 처리해주는 커스텀 axios 설정 파일
// get방식 post방식 등을 계속해서 요청하지 않고 자동으로 하게 만드는 파일

// 즉, API 요청할 때마다 토큰 붙이고
// 인증 실패(401)하면 자동 로그 아웃까지 처리해주는 구조입니다.
// 전체 과정 : 토큰확인 - 토큰이 없거나 올바르지 않은 토큰일 경우 삭제 후 로그인 페이지로 보내서 새로운 토큰 생성 유도

import axios from "axios";
import { API_BASE_URL } from "../config/config";
import { triggerAlert } from "../utils/alertEvent";

// withCredentials: true 항목은 세션 방식 설정이므로 jwt를 사용하면 삭제하도록 합니다.
const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

// 인터셉터(interceptor) : 요청(Request)이나 응답(Response)을 가로 채서 공통 로직을 처리하는 기능입니다.
// 요청(Request) : ~하기 전에 가로채기 (사전)
// 응답(Response) : ~한 후에 가로채기 (사후)
// 요청을 보내기 전에 인터셉터가 자동으로 JWT 붙이기 (사전에 가로채기)
// 토큰을 확인하는 과정
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken"); // 로컬 저장소에 accessToken이라는 이름으로 만들어 놓음
        if (token) { // token가 undefined일 수 있으므로...
            config.headers = config.headers || {};
            // Bearer 단어 대소문자 주의 바람
            config.headers.Authorization = `Bearer ${token}`;
        }


        return config;
    },
    (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────
// 응답 처리 : access token 만료(401) 시 refresh token으로 자동 재발급
// ─────────────────────────────────────────────────────────────
// [핵심 흐름]
//  1) 어떤 요청이 401로 실패한다 (access token 만료).
//  2) 저장해 둔 refresh token으로 /member/refresh를 호출해 새 access token을 받는다.
//  3) 새 토큰을 저장하고, 실패했던 "원래 요청"을 새 토큰으로 다시 보낸다(재시도).
//  4) refresh마저 실패하면(= refresh token도 만료/무효) 토큰을 모두 지우고 로그인 페이지로 보낸다.

// 동시에 여러 요청이 401을 만나도 refresh는 "한 번만" 실행되도록 제어하는 변수들.
// isRefreshing: 지금 재발급이 진행 중인지 여부.
// pendingQueue: 재발급이 끝나길 기다리는 요청들의 콜백 목록.
let isRefreshing = false;
let pendingQueue: Array<(newToken: string | null) => void> = [];

// 대기 중이던 요청들에게 재발급 결과(새 토큰 or null)를 한꺼번에 알려준다.
const processQueue = (newToken: string | null) => {
    pendingQueue.forEach((callback) => callback(newToken));
    pendingQueue = [];
};

// 토큰을 모두 지우고 로그인 페이지로 보내는 공통 처리(강제 로그아웃).
const forceLogout = (message: string) => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    triggerAlert(message, "warning", "세션 만료");
    setTimeout(() => window.location.replace("/member/login"), 1500);
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // axios 요청 설정 객체. 커스텀 플래그(_retry)를 붙이기 위해 any로 다룬다.
        const originalRequest: any = error.config;
        const status = error.response?.status;
        const url: string = originalRequest?.url || "";

        // 로그인/재발급 요청 자체의 401은 재발급 대상이 아니다(무한 루프 방지).
        const isAuthEndpoint = url.includes("/member/login") || url.includes("/member/refresh");

        // ── access token 만료 → 재발급 시도 ──
        // originalRequest._retry: 같은 요청을 두 번 이상 재시도하지 않기 위한 표시.
        if (status === 401 && !isAuthEndpoint && !originalRequest?._retry) {
            const refreshToken = localStorage.getItem("refreshToken");
            const accessToken = localStorage.getItem("accessToken");

            // 토큰이 아예 없는 비로그인 상태의 401이면, 강제 이동 없이 그냥 에러를 돌려준다.
            if (!refreshToken && !accessToken) {
                return Promise.reject(error);
            }
            // refresh token이 없으면 재발급이 불가능하므로 바로 로그아웃.
            if (!refreshToken) {
                forceLogout("로그인 세션이 만료되었습니다.\n다시 로그인해주세요.");
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            // 이미 다른 요청이 재발급을 진행 중이면, 끝날 때까지 기다렸다가 새 토큰으로 재시도한다.
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push((newToken) => {
                        if (newToken) {
                            originalRequest.headers = originalRequest.headers || {};
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            resolve(axiosInstance(originalRequest));
                        } else {
                            reject(error);
                        }
                    });
                });
            }

            // 이 요청이 재발급을 직접 수행한다.
            isRefreshing = true;
            try {
                // [중요] 재발급 호출은 axiosInstance가 아닌 기본 axios로 보낸다.
                // 인터셉터를 거치지 않게 해서, 만료된 access token이 헤더에 붙거나
                // 이 응답이 다시 401 처리 로직으로 들어가는 재귀를 막는다.
                const res = await axios.post(`${API_BASE_URL}/member/refresh`, { refreshToken });

                const newAccessToken: string = res.data.accessToken;
                localStorage.setItem("accessToken", newAccessToken);
                // 서버가 새 refresh token도 함께 내려주면 갱신한다(회전 방식 대비).
                if (res.data.refreshToken) {
                    localStorage.setItem("refreshToken", res.data.refreshToken);
                }

                // 대기 중이던 요청들에게 새 토큰을 전달해 함께 재시도시킨다.
                processQueue(newAccessToken);

                // 원래 실패했던 요청을 새 토큰으로 다시 보낸다.
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // 재발급 실패 = refresh token도 만료/무효 → 대기 요청 모두 실패 처리 후 로그아웃.
                processQueue(null);
                forceLogout("로그인 세션이 만료되었습니다.\n다시 로그인해주세요.");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ── 그 외 상태코드는 기존과 동일하게 사용자에게 안내 ──
        if (status === 403) {
            triggerAlert("접근 권한이 없습니다.", "error", "권한 오류");
        } else if (status === 404) {
            triggerAlert("요청한 데이터를 찾을 수 없습니다.", "warning", "데이터 없음");
        } else if (status === 409) {
            const msg = error.response?.data?.message || error.response?.data || "이미 존재하는 데이터입니다.";
            triggerAlert(String(msg), "warning", "중복 오류");
        } else if (status >= 500) {
            triggerAlert("서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.", "error", "서버 오류");
        } else if (!error.response) {
            // 네트워크 단절 또는 서버 무응답
            triggerAlert("서버에 연결할 수 없습니다.\n네트워크 상태를 확인해주세요.", "error", "연결 오류");
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
