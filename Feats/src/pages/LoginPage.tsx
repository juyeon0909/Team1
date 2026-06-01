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
  const [authNumber, setAuthNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [randomValue, setRandomValue] = useState("");
  const [servicePassword, setServicePassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(POLL_DURATION);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigate = useNavigate();

  // 모든 타이머 정지 및 초기화 함수
  const stopAll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setServicePassword("");
  };

  // 컴포넌트가 화면에서 사라질 때(언마운트) 타이머 찌꺼기 청소
  useEffect(() => {
    return () => stopAll();
  }, []);

  const startPolling = (currentEmail: string, currentRandomValue: string) => {
    setTimeLeft(POLL_DURATION);

    // 1초 카운트다운 타이머
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopAll();
          alert("인증 시간이 초과되었습니다.");
          setIsPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 1초마다 승인 여부 확인
    pollRef.current = setInterval(async () => {
      try {
        const { data: isApproved } = await axios.get<boolean>(
          "/passwordless/check-result",
          { params: { email: currentEmail, randomValue: currentRandomValue } }
        );
        if (isApproved) {
          stopAll();
          console.log("[패스워드리스] 승인 확인됨, 로그인 요청 시작");
          try {
            const { data } = await axios.post<LoginResponse>(
              "/passwordless/passwordless-login",
              null,
              { params: { email: currentEmail, randomValue: currentRandomValue } }
            );
            console.log("[패스워드리스] 로그인 응답:", data);
            const { accessToken, ...userData } = data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("user", JSON.stringify(userData));
            onLogin(userData);
            navigate("/");
          } catch (err: any) {
            console.error("[패스워드리스] 로그인 실패:", err.response?.status, err.response?.data);
            setErrors("로그인 처리 중 오류가 발생했습니다.");
            setIsPolling(false);
          }
        }
      } catch {
        // 폴링 에러 무시
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
      // 취소 에러 무시
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors("");

    if (loginMode === "passwordless") {
      if (isRequesting) return;
      setIsRequesting(true);
      try {
        const { data } = await axios.post<{ randomValue: string; servicePassword: string }>(
          "/passwordless/getSp", null, { params: { email } }
        );

        setRandomValue(data.randomValue);
        setServicePassword(data.servicePassword);
        setIsPolling(true);
        startPolling(email, data.randomValue);
      } catch (error: any) {
        setErrors(error.response?.data || "패스워드리스 인증 요청에 실패했습니다.");
      } finally {
        setIsRequesting(false);
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
      const msg = error.response?.data?.error ?? "서버 오류가 발생했습니다.";
      setErrors(msg);
      if (error.response?.status === 403 && msg === "패스워드리스로 로그인해주세요.") {
        setLoginMode("passwordless");
        setPassword("");
      }
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

          {/* 인증번호 박스 (패스워드리스 + 폴링 중에만 표시) */}
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
                  padding: "7px 16px",
                  backgroundColor: "#f0faf5",
                  textAlign: "center",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.5em",
                  color: "#1a9d60",
                  userSelect: "none",
                }}
              >
                {servicePassword}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "10px", textAlign: "center", lineHeight: 1.6 }}>
                모바일 앱에 표시된 번호와 일치하면 승인해주세요
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
          {loginMode === "passwordless" && !isPolling && (
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
              onClick={(event) => {
                event.stopPropagation();
                alert(`인증을 취소하였습니다.`)
                handleCancelPolling();
              }}
            >
              인증 취소
            </button>
          ) : (
            <button type="submit" className="btn-submit-green" disabled={isRequesting}>
              {isRequesting ? "요청 중..." : loginMode === "normal" ? "로그인" : "인증 요청"}
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
              </div>
            )
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;