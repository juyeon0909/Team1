// 로그인 인증(JWT)을 자동으로 처리해주는 커스텀 axios 설정 파일
// get방식 post방식 등을 계속해서 요청하지 않고 자동으로 하게 만드는 파일

// 즉, API 요청할 때마다 토큰 붙이고
// 인증 실패(401)하면 자동 로그 아웃까지 처리해주는 구조입니다.
// 전체 과정 : 토큰확인 - 토큰이 없거나 올바르지 않은 토큰일 경우 삭제 후 로그인 페이지로 보내서 새로운 토큰 생성 유도

import axios from "axios";
import { API_BASE_URL } from "../config/config";

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
        console.log("interceptors.request 토큰 확인 : ", token);

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

        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem("accessToken");

            // window.location.href 사용시 React Router 사용 중이면 
            // 페이지 전체 리로드 발생할 수 있으므로 replace() 메소드 사용 바람
            window.location.replace("/member/login");
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;