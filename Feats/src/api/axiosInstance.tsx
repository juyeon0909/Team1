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

// 응답 처리 : 401 에러 발생 시 자동 로그 아웃 처리 (사후에 가로채기)
// 401에러 : 인증이 필요하거나 실패했다는 의미
// 올바르지 않아서 401에러가 생긴? 토큰 삭제 후 로그인 페이지로 유도하기
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {

        const isLoginRequest = error.config?.url?.includes("/member/login");
        const status = error.response?.status;

        if (status === 401 && !isLoginRequest) {
            const token = localStorage.getItem("accessToken");
            if (token) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                triggerAlert("로그인 세션이 만료되었습니다.\n다시 로그인해주세요.", "warning", "세션 만료");
                setTimeout(() => window.location.replace("/member/login"), 1500);
            }
        } else if (status === 403) {
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