// 이 파일은 백앤드의 url과 포트 번호를 저장해 놓은 설정용 파일입니다.
// const API_HOST = "localhost"; // 호스트 컴퓨터의 이름(127.0.0.1)

// const API_PORT = "9000"; // 스프링 부트의 Port 번호

// export 키워드를 적어 주어야 외부에서 이 파일을 접근할 수 있습니다.
// export const API_BASE_URL: string =
//     import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

// 앞으로 http://localhost:9000를 적지 말고, API_BASE_URL를 사용하면 됩니다.


// src/config/config.ts

// 1. .env에서 값 가져오기 (없을 경우를 대비한 기본값 설정)
const API_HOST = import.meta.env.VITE_API_HOST || "localhost";
const API_PORT = import.meta.env.VITE_API_PORT || "9000";

export const API_BASE_URL = 
  import.meta.env.MODE === 'production' 
    ? '/api' // 배포 환경: 같은 도메인의 /api 경로 사용
    : `http://${API_HOST}:${API_PORT}/api`; // 개발 환경: http://localhost:8081/api
