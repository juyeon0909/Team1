import React, { useState, useEffect, useRef } from "react";
import { Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance.tsx";
import type { LoginResponse, User } from "../types/User";
import "../components/LoginPage.css";

interface Props {
  onLogin: (user: User) => void;
}

type LoginMode = "normal" | "passwordless";

const POLL_DURATION = 60;

function LoginPage({ onLogin }: Props) {
  const [loginMode, setLoginMode] = useState<LoginMode>("normal");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [randomValue, setRandomValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(POLL_DURATION);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigate = useNavigate();

  const stopAll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  useEffect(() => () => stopAll(), []);

  const startPolling = (emailVal: string, rv: string) => {
    let remaining = POLL_DURATION;
    setTimeLeft(POLL_DURATION);

    timerRef.current = setInterval(() => {
      remaining--;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        stopAll();
        setIsPolling(false);
        setRandomValue("");
        setErrors("인증 시간이 초과되었습니다. 다시 시도해주세요.");
      }
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const { data: approved } = await axios.get<boolean>("/passwordless/check-result", {
          params: { email: emailVal, randomValue: rv },
        });
        if (approved) {
          stopAll();
          const { data } = await axios.post("/passwordless/passwordless-login", null, {
            params: { email: emailVal, randomValue: rv },
          });
          const { accessToken, ...userData } = data as LoginResponse;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(userData));
          onLogin(userData as User);
          navigate("/");
        }
      } catch {
        // 폴링 중 네트워크 오류는 무시하고 계속 시도
      }
    }, 1000);
  };

  const handleCancelPolling = async () => {
    stopAll();
    setIsPolling(false);
    setRandomValue("");
    try {
      await axios.post("/passwordless/cancel", null, {
        params: { email, randomValue },
      });
    } catch {
      // 취소 요청 실패는 무시
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors("");

    if (loginMode === "passwordless") {
      try {
        const { data: rv } = await axios.post<string>("/passwordless/getSp", null, {
          params: { email },
        });
        setRandomValue(rv);
        setIsPolling(true);
        startPolling(email, rv);
      } catch (error: any) {
        setErrors(error.response?.data || "패스워드리스 인증 요청에 실패했습니다.");
      }
      return;
    }

    try {
      const response = await axios.post<LoginResponse>(
        "/member/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      const { accessToken, ...userData } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      onLogin(userData);
      navigate("/");
    } catch (error: any) {
      setErrors(error.response?.data?.error ?? "서버 오류가 발생했습니다.");
    }
  };

  const handleTabSwitch = (mode: LoginMode) => {
    if (isPolling) return;
    setLoginMode(mode);
    setErrors("");
  };

  return (
    <div className="login-page-container">

      {/* LEFT: 브랜드 섹션 */}
      <div className="login-brand-section">
        <div className="brand-badge">냉장고 속 재료로 요리하기</div>

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
          <p>내 냉장고 속 재료로 오늘의 레시피를 찾아보세요</p>
        </div>

        {errors && <Alert variant="danger">{errors}</Alert>}

        {/* 인증 방식 탭 */}
        <div className="login-tab-group">
          <button
            type="button"
            className={`login-tab login-tab-border-right ${loginMode === "normal" ? "active" : ""}`}
            onClick={() => handleTabSwitch("normal")}
            disabled={isPolling}
          >
            일반 로그인
            {loginMode === "normal" && <span style={{ color: "#1a9d60" }}>✔</span>}
          </button>
          <button
            type="button"
            className={`login-tab ${loginMode === "passwordless" ? "active" : ""}`}
            onClick={() => handleTabSwitch("passwordless")}
            disabled={isPolling}
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
              disabled={isPolling}
            />
          </div>

          {/* 인증번호 박스 (패스워드리스 + 폴링 중에만 표시, 이메일 창 아래) */}
          {loginMode === "passwordless" && isPolling && (
            <div className="custom-input-group">
              <div className="custom-input-label" style={{ marginBottom: "8px" }}>
                인증번호&nbsp;
                <span style={{ color: timeLeft <= 10 ? "#cc3333" : "#1a9d60", fontWeight: 700 }}>
                  ({timeLeft}초 남음)
                </span>
              </div>
              <div
                style={{
                  border: "2px solid #1a9d60",
                  borderRadius: "8px",
                  padding: "20px 16px",
                  backgroundColor: "#f0faf5",
                  textAlign: "center",
                  fontSize: "2rem",
                  fontWeight: 700,
                  letterSpacing: "0.5em",
                  color: "#1a9d60",
                  userSelect: "none",
                }}
              >
                {randomValue}
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#555",
                  marginTop: "10px",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                모바일 앱에서 위 인증번호를 확인하고 승인해주세요
              </p>
            </div>
          )}

          {/* 비밀번호 (일반 모드만) */}
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

          {/* 버튼: 폴링 중이면 취소, 아니면 제출 */}
          {isPolling ? (
            <button
              type="button"
              className="btn-submit-green"
              style={{ backgroundColor: "#cc3333" }}
              onClick={handleCancelPolling}
            >
              인증 취소
            </button>
          ) : (
            
            <button type="submit" className="btn-submit-green">
              {loginMode === "normal" ? "로그인" : "인증 요청"}
            </button>
          )}

          {/* 하단 링크 */}
          {!isPolling && (
            loginMode === "normal" ? (
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
            )
          )}

        </form>
      </div>

    </div>
  );
}

export default LoginPage;
