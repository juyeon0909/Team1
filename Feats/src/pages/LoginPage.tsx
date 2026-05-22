// import { useState } from "react";
// import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
// import { Link, useNavigate } from "react-router-dom";

// import axios from "../api/axiosInstance.tsx";
// import type { LoginResponse, User } from "../types/User";

// interface Props {
//     // onLogin 프롭스는 User 형식으로 매개 변수를 받고, 반환 타입이 없습니다.
//     onLogin: (user: User) => void;
// }

// function App({ onLogin }: Props) {
//     // 이 문서내에서 바뀔 소지가 있는 것들은 state로 만들어 관리 할 수 있음
//     // props는 부모에게서! 받은거고 / state는 자신의 문서 내에서! 있는 것들이고
//     // 로그인과 관련된 state
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');

//     // 에러 관련 메시지
//     const [errors, setErrors] = useState('');

//     const navigate = useNavigate();

//     const handleLogin = async (event: React.SubmitEvent) => {
//         event.preventDefault();
//         console.log('로그인 시도중입니다.');

//         try {
//             const url = '/member/login';
//             const params = { email, password }; // 파라미터
//             const config = {
//                 headers: {
//                     "Content-Type": "application/json"
//                 }
//             };

//             const response = await axios.post<LoginResponse>(url, params, config);

//             console.log('응답 데이터 : \n' + response.data);

//             // 서버의 응답을 전개 연산자로 처리합니다.
//             // accessToken는 JWT, userData는 User.ts으로 구성된 객체
//             const { accessToken, ...userData } = response.data;

//             localStorage.setItem("accessToken", accessToken);

//             console.log('로그인 성공 사용자 : ' + userData);


//             if (onLogin) {
//                 onLogin(userData);

//                 // userData는 자바스크립트 객체여서 문자열로 바꿔줘야 함
//                 // JSON.stringify 함수는 JavaScript 객체를 JSON 문자열로 변환해 줍니다.
//                 localStorage.setItem("user", JSON.stringify(userData));
//             }

//             navigate("/");

//         } catch (error: any) {
//             if (error.response) {
//                 setErrors(error.response.data.message || "로그인 실패");
//             } else {
//                 setErrors("Server Error");
//             }
//         }
//     };

//     console.log('자바스크립트 코딩 영역');

//     return (

//         <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
//             <Row className="w-100 justify-content-center">
//                 <Col md={6} sm={10}>
//                     <Card>
//                         <Card.Body>
//                             <h2 className="text-center mb-4">로그인</h2>

//                             {errors && <Alert variant="danger">{errors}</Alert>}

//                             <Form onSubmit={handleLogin}>
//                                 <Form.Group as={Row} className="mb-3 align-items-center">
//                                     <Form.Label column sm={3} className="text-end fw-bold text-primary">
//                                         이메일
//                                     </Form.Label>
//                                     <Col sm={9}>
//                                         <Form.Control
//                                             type="email"
//                                             placeholder="이메일을 입력해 주세요."
//                                             value={email}
//                                             onChange={(e) => setEmail(e.target.value)}
//                                             required
//                                         />
//                                     </Col>
//                                 </Form.Group>

//                                 <Form.Group as={Row} className="mb-3 align-items-center">
//                                     <Form.Label column sm={3} className="text-end fw-bold text-primary">
//                                         비밀 번호
//                                     </Form.Label>
//                                     <Col sm={9}>
//                                         <Form.Control
//                                             type="password"
//                                             placeholder="비밀 번호을 입력해 주세요."
//                                             value={password}
//                                             onChange={(e) => setPassword(e.target.value)}
//                                             required
//                                         />
//                                     </Col>
//                                 </Form.Group>

//                                 <Row className="g-2">
//                                     <Col xs={8}>
//                                         <Button variant="primary" type="submit" className="w-100">
//                                             로그인
//                                         </Button>
//                                     </Col>
//                                     <Col xs={4}>
//                                         <Link to="/member/signup" className="btn btn-outline-secondary w-100">
//                                             회원 가입
//                                         </Link>
//                                     </Col>
//                                 </Row>
//                             </Form>

//                         </Card.Body>
//                     </Card>
//                 </Col>
//             </Row>
//         </Container>
//     );
// };

//  export default App;



// import React, { useState } from "react";
// import { Alert } from "react-bootstrap";
// import { Link, useNavigate } from "react-router-dom";
// import axios from "../api/axiosInstance.tsx";
// import type { LoginResponse, User } from "../types/User";
// import "../components/LoginPage.css"; // 👈 커스텀 전용 CSS 로드

// interface Props {
//     onLogin: (user: User) => void;
// }

// // 로그인 모드 타입 정의
// type LoginMode = 'normal' | 'passwordless';

// function LoginPage({ onLogin }: Props) {
//     // 탭 상태 관리 ('normal' = 일반, 'passwordless' = 패스워드리스)
//     const [loginMode, setLoginMode] = useState<LoginMode>('normal');

//     // 로그인 입력 데이터 상태 관리
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [errors, setErrors] = useState('');

//     const navigate = useNavigate();

//     // 폼 제출 이벤트 핸들러
//     const handleLogin = async (event: React.FormEvent) => {
//         event.preventDefault();
//         setErrors(''); // 에러 초기화

//         if (loginMode === 'passwordless') {
//             console.log('패스워드리스 로그인 시도:', email);
//             alert('패스워드리스 링크가 이메일로 전송되었거나 인증 진행 중입니다.');
//             return;
//         }

//         console.log('일반 로그인 시도중입니다.');
//         try {
//             const url = '/member/login';
//             const params = { email, password };
//             const config = {
//                 headers: { "Content-Type": "application/json" }
//             };

//             const response = await axios.post<LoginResponse>(url, params, config);
//             const { accessToken, ...userData } = response.data;

//             localStorage.setItem("accessToken", accessToken);

//             if (onLogin) {
//                 onLogin(userData);
//                 localStorage.setItem("user", JSON.stringify(userData));
//             }
//             navigate("/");
//         } catch (error: any) {
//             if (error.response) {
//                 alert(error.response.data.message || "로그인 실패");
//             } else {
//                 alert("Server Error");
//             }
//         }
//     };

//     return (
//         <div className="login-page-container">

//             {/*  LEFT: 브랜드 소개 섹션 (초록 배경) */}
//             <div className="login-brand-section">
//                 <div className="brand-badge"> 냉장고 속 재료로 요리하기</div>

//                 {/* 스크린샷의 냉장고 아이콘 박스 형상화 */}
//                 <div className="brand-logo-img">
//                     <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <rect x="10" y="5" width="80" height="110" rx="15" fill="#e8f5e9" stroke="#ffffff" strokeWidth="4" />
//                         <line x1="10" y1="55" x2="90" y2="55" stroke="#ffffff" strokeWidth="4" />
//                         <rect x="25" y="20" width="50" height="10" rx="3" fill="#f5a623" />
//                         <rect x="25" y="35" width="50" height="10" rx="3" fill="#6abf69" />
//                         <rect x="25" y="70" width="35" height="10" rx="3" fill="#f9c74f" />
//                         <rect x="25" y="85" width="50" height="10" rx="3" fill="#6abf69" />
//                     </svg>
//                 </div>

//                 <h1 className="brand-title">잇츠 인 마이 냉장고</h1>
//                 <p className="brand-subtitle">
//                     냉장고 재고 기반<br />
//                     맞춤형 레시피 추천 서비스
//                 </p>

//                 <div className="brand-tags">
//                     <span className="brand-tag">유통기한 알림</span>
//                     <span className="brand-tag">재료 매칭</span>
//                     <span className="brand-tag">레시피 추천</span>
//                     <span className="brand-tag">식비 절약</span>
//                 </div>
//             </div>

//             {/*  RIGHT: 실제 로그인 폼 섹션 (흰색 배경) */}
//             <div className="login-form-section">
//                 <div className="login-form-header">
//                     <h2>로그인</h2>
//                     <p>내 냉장고 속 재료로 오늘의 레시피를 찾아보세요 </p>
//                 </div>

//                 {errors && <Alert variant="danger">{errors}</Alert>}

//                 {/*  탭 전환 버튼 영역 */}
//                 <div className="login-tab-group">
//                     <button
//                         type="button"
//                         className={`login-tab login-tab-border-right ${loginMode === 'normal' ? 'active' : ''}`}
//                         onClick={() => setLoginMode('normal')}
//                     >
//                         일반 {loginMode === 'normal' && <span style={{ color: '#1a9d60' }}>✔️</span>}
//                     </button>
//                     <button
//                         type="button"
//                         className={`login-tab ${loginMode === 'passwordless' ? 'active' : ''}`}
//                         onClick={() => setLoginMode('passwordless')}
//                     >
//                         패스워드리스 {loginMode === 'passwordless' && <span style={{ color: '#1a9d60' }}>✔️</span>}
//                     </button>
//                 </div>

//                 {/* 폼 작성 영역 */}
//                 <form onSubmit={handleLogin}>

//                     {/* 이메일 입력창 (공통) */}
//                     <div className="custom-input-group">
//                         <label className="custom-input-label">이메일</label>
//                         <input
//                             type="email"
//                             className="custom-form-control"
//                             placeholder="이메일을 입력해주세요"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                         />
//                     </div>

//                     {/*  조건부 렌더링: 일반 로그인 모드일 때만 비밀번호 창 표시 */}
//                     {loginMode === 'normal' && (
//                         <div className="custom-input-group">
//                             <label className="custom-input-label">비밀번호</label>
//                             <input
//                                 type="password"
//                                 className="custom-form-control"
//                                 placeholder="비밀번호를 입력하세요"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 required
//                             />
//                         </div>
//                     )}
//                     {loginMode === 'passwordless' && (
//                         <div className="custom-input-group">
//                             <label className="custom-input-label">passwordless</label>
//                             <input
//                                 type="password"
//                                 className="custom-form-passwordless"
//                                 placeholder="인증번호 확인"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 required
//                                 readOnly
//                             />
//                         </div>
//                     )}

//                     {/* 로그인 제출 버튼 */}
//                     <button type="submit" className="btn-submit-green">
//                         로그인
//                     </button>

//                     {/*  탭 종류에 따라 하단 메뉴 스위칭 (스크린샷 내용 반영) */}
//                     {loginMode === 'normal' ? (
//                         <div className="login-footer-links">
//                             <div>
//                                 계정이 없으신가요?
//                                 <Link to="/member/signup" className="login-link-highlight">회원가입</Link>
//                             </div>
//                             <div className="login-link-plain">
//                                 비밀번호
//                                 <Link to="/member/find-password" className="login-link-highlight">찾기/초기화</Link>
//                             </div>


//                         </div>
//                     ) : (
//                         <div className="login-footer-links">
//                             <div>
//                                 패스워드리스
//                                 <Link to="/member/passwordless-register" className="login-link-highlight">등록</Link>
//                             </div>
//                             <div className="login-link-plain">
//                                 비밀번호
//                                 <Link to="/member/reset-password" className="login-link-highlight">찾기/초기화</Link>
//                             </div>
//                         </div>
//                     )}
//                 </form>
//             </div>




//         </div>
//     );
// }

// export default LoginPage;

import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance.tsx";
import type { LoginResponse, User } from "../types/User";
import "../components/LoginPage.css";
import { API_BASE_URL } from "../config/config";

interface Props {
  onLogin: (user: User) => void;
}

type LoginMode = "normal" | "passwordless";

function LoginPage({ onLogin }: Props) {
  const [loginMode, setLoginMode] = useState<LoginMode>("normal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors("");

    if (loginMode === "passwordless") {
      alert("패스워드리스 링크가 이메일로 전송되었습니다.");
      return;
    }

    try {

      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/member/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      const { accessToken, ...userData } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
      navigate("/");
    } catch (error: any) {
      const message = error.response?.data?.message ?? "서버 오류가 발생했습니다.";
      setErrors(message);
    }
  };

  return (
    <div className="login-page-container">

      {/* LEFT: 브랜드 섹션 */}
      <div className="login-brand-section">
        <div className="brand-badge"> 냉장고 속 재료로 요리하기</div>

        <div className="brand-logo-img">
          <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="5" width="80" height="110" rx="15" fill="#e8f5e9" stroke="#ffffff" strokeWidth="4" />
            <line x1="10" y1="55" x2="90" y2="55" stroke="#ffffff" strokeWidth="4" />
            <rect x="25" y="20" width="50" height="10" rx="3" fill="#f5a623" />
            <rect x="25" y="35" width="50" height="10" rx="3" fill="#6abf69" />
            <rect x="25" y="70" width="35" height="10" rx="3" fill="#f9c74f" />
            <rect x="25" y="85" width="50" height="10" rx="3" fill="#6abf69" />
          </svg>
        </div>

        <h1 className="brand-title">잇츠 인 마이 냉장고</h1>
        <p className="brand-subtitle">
          냉장고 재고 기반<br />
          맞춤형 레시피 추천 서비스
        </p>

        <div className="brand-tags">
          <span className="brand-tag">유통기한 알림</span>
          <span className="brand-tag">재료 매칭</span>
          <span className="brand-tag">레시피 추천</span>
          <span className="brand-tag">식비 절약</span>
        </div>
      </div>

      {/* RIGHT: 로그인 폼 섹션 */}
      <div className="login-form-section">
        <div className="login-form-header">
          <h2>로그인</h2>
          <p>내 냉장고 속 재료로 오늘의 레시피를 찾아보세요 🍳</p>
        </div>

        {errors && <Alert variant="danger">{errors}</Alert>}

        {/* 탭 */}
        <div className="login-tab-group">
          <button
            type="button"
            className={`login-tab login-tab-border-right ${loginMode === "normal" ? "active" : ""}`}
            onClick={() => setLoginMode("normal")}
          >
            일반 로그인
            {loginMode === "normal" && <span style={{ color: "#1a9d60" }}>✔</span>}
          </button>
          <button
            type="button"
            className={`login-tab ${loginMode === "passwordless" ? "active" : ""}`}
            onClick={() => setLoginMode("passwordless")}
          >
            패스워드리스
            {loginMode === "passwordless" && <span style={{ color: "#1a9d60" }}>✔</span>}
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleLogin}>

          {/* 이메일 */}
          <div className="custom-input-group">
            <label className="custom-input-label">이메일</label>
            <input
              type="email"
              className="custom-form-control"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* 비밀번호 (일반 모드) */}
          {loginMode === "normal" && (
            <div className="custom-input-group">
              <label className="custom-input-label">비밀번호</label>
              <input
                type="password"
                className="custom-form-control"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* 패스워드리스 안내 인풋 */}
          {loginMode === "passwordless" && (
            <div className="custom-input-group">
              <label className="custom-input-label">인증 방식</label>
              <input
                type="text"
                className="custom-form-passwordless"
                placeholder="인증 번호가 표시됩니다"
                readOnly
              />
            </div>
          )}

          {/* 제출 버튼 */}
          <button type="submit" className="btn-submit-green">
            {loginMode === "normal" ? "로그인" : "로그인"}
          </button>

          {/* 하단 링크 */}
          {loginMode === "normal" ? (
            <div className="login-footer-links">
              <span>
                계정이 없으신가요?
                <Link to="/member/signup" className="login-link-highlight">회원가입</Link>
              </span>
              <span>
                비밀번호
                <Link to="/member/reset-password" className="login-link-highlight">초기화</Link>
              </span>
            </div>
          ) : (
            <div className="login-footer-links">
              <span>
                패스워드리스
                <Link to="/member/passwordless-register" className="login-link-highlight">등록</Link>
              </span>
              <span>
                등록
                <Link to="/member/reset-register" className="login-link-highlight">해지</Link>
              </span>
            </div>
          )}

        </form>
      </div>

    </div>
  );
}

export default LoginPage;