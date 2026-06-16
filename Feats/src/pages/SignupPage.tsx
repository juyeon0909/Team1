import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axiosLib from "axios"
import axios from "../api/axiosInstance.tsx";
import "../components/SignupPage.css";

// 원본 코드의 필드별 에러 객체 구조 그대로 유지
interface SignupErrors {
  name: string;
  email: string;
  password: string;
  address: string;
  general: string;
}

function SignupPage() {
  //  원본과 동일한 state 구조 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({
    name: "", email: "", password: "", address: "", general: "",
  });

  //  추가: 비밀번호 확인 / UI 상태 
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pwStrength, setPwStrength] = useState({
    width: "0%", color: "#eee",
    label: "영문, 숫자, 특수문자 포함 8자 이상", labelColor: "#aaa",
  });
  const [matchMsg, setMatchMsg] = useState({ text: "", color: "" });

  const navigate = useNavigate();

  //  비밀번호 강도 체크  
  const checkStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Za-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const map: Record<number, typeof pwStrength> = {
      0: { width: "0%", color: "#eee", label: "영문, 숫자, 특수문자 포함 8자 이상", labelColor: "#aaa" },
      1: { width: "25%", color: "#e53935", label: "약함", labelColor: "#e53935" },
      2: { width: "50%", color: "#fb8c00", label: "보통", labelColor: "#fb8c00" },
      3: { width: "75%", color: "#fdd835", label: "강함", labelColor: "#b8a200" },
      4: { width: "100%", color: "#4caf50", label: "매우 강함", labelColor: "#4caf50" },
    };
    setPwStrength(map[score]);
  };

  //  비밀번호 일치 체크  
  const checkMatch = (pw: string, pw2: string) => {
    if (!pw2) { setMatchMsg({ text: "", color: "" }); return; }
    if (pw === pw2) setMatchMsg({ text: "비밀번호가 일치합니다", color: "#4caf50" });
    else setMatchMsg({ text: "비밀번호가 일치하지 않습니다", color: "#e53935" });
  };

  //  버튼 활성화 조건  
  const isSubmittable =
    name.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 8 &&
    password === passwordConfirm;

  //  원본 로직 그대로 유지한 제출 핸들러  
  const SignupAction = async (event: React.FormEvent) => {
    event.preventDefault();

    // 에러 초기화
    setErrors({ name: "", email: "", password: "", address: "", general: "" });

    try {
      const response = await axios.post(
        "/member/signup",
        { name, email, password, address },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        alert("회원 가입 성공");
        navigate("/member/login");
      }
    } catch (error) {
      if (axiosLib.isAxiosError(error)) {
        if (error.response?.data) {
          setErrors(error.response.data);
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "회원 가입 중에 오류가 발생하였습니다.",
        }));
      }
    }
  };

  return (
    <div className="signup-page-container">

       {/* 왼쪽 브랜드 섹션 (로그인과 동일)  */}
      <div className="signup-brand-section">
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

      {/*  오른쪽 폼 섹션  */}
      <div className="signup-form-section">
        <div className="signup-form-header">
          <h2>회원가입</h2>
          <p>내 냉장고 속 재료로 오늘의 레시피를 찾아보세요</p>
        </div>

        {/* 일반 오류 (원본과 동일) */}
        {errors.general && <Alert variant="danger">{errors.general}</Alert>}

        <form onSubmit={SignupAction}>

          {/* 이름 */}
          <div className="custom-input-group">
            <label className="custom-input-label">
              이름<span className="required-mark">*</span>
            </label>
            <input
              type="text"
              className={`custom-form-control${errors.name ? " is-invalid" : ""}`}
              placeholder="이름을 입력해 주세요."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {/* 원본의 Form.Control.Feedback 역할 */}
            {errors.name && <p className="input-hint" style={{ color: "#e53935" }}>{errors.name}</p>}
          </div>

          {/* 이메일 */}
          <div className="custom-input-group">
            <label className="custom-input-label">
              이메일<span className="required-mark">*</span>
            </label>
            <input
              type="email"
              className={`custom-form-control${errors.email ? " is-invalid" : ""}`}
              placeholder="이메일을 입력해 주세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <p className="input-hint" style={{ color: "#e53935" }}>{errors.email}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="custom-input-group">
            <label className="custom-input-label">
              비밀번호<span className="required-mark">*</span>
            </label>
            <div className="pw-input-wrap">
              <input
                type={showPw ? "text" : "password"}
                className={`custom-form-control${errors.password ? " is-invalid" : ""}`}
                placeholder="비밀 번호를 입력해 주세요."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkStrength(e.target.value);
                  checkMatch(e.target.value, passwordConfirm);
                }}
                required
              />
              <button
                type="button"
                className="pw-toggle-btn"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                <i className={showPw ? "ti ti-eye-off" : "ti ti-eye"} />
              </button>
            </div>
            <div className="pw-strength-bar-wrap">
              <div className="pw-strength-bar" style={{ width: pwStrength.width, background: pwStrength.color }} />
            </div>
            <p className="input-hint" style={{ color: pwStrength.labelColor }}>{pwStrength.label}</p>
            {errors.password && <p className="input-hint" style={{ color: "#e53935" }}>{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="custom-input-group">
            <label className="custom-input-label">
              비밀번호 확인<span className="required-mark">*</span>
            </label>
            <div className="pw-input-wrap">
              <input
                type={showPw2 ? "text" : "password"}
                className="custom-form-control"
                placeholder="비밀번호를 다시 입력해 주세요."
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  checkMatch(password, e.target.value);
                }}
                required
              />
              <button
                type="button"
                className="pw-toggle-btn"
                onClick={() => setShowPw2((v) => !v)}
                tabIndex={-1}
              >
                <i className={showPw2 ? "ti ti-eye-off" : "ti ti-eye"} />
              </button>
            </div>
            {matchMsg.text && (
              <p className="input-match-hint" style={{ color: matchMsg.color }}>{matchMsg.text}</p>
            )}
          </div>

          {/* 주소 */}
          <div className="custom-input-group">
            <label className="custom-input-label">주소</label>
            <input
              type="text"
              className={`custom-form-control${errors.address ? " is-invalid" : ""}`}
              placeholder="주소를 입력해 주세요."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            {errors.address && <p className="input-hint" style={{ color: "#e53935" }}>{errors.address}</p>}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="btn-submit-green"
            disabled={!isSubmittable}
          >
            회원 가입
          </button>

          {/* 하단 링크 */}
          <div className="login-footer-links">
            <span>
              이미 계정이 있으신가요?
              <Link to="/member/login" className="login-link-highlight">로그인</Link>
            </span>
            
          </div>

        </form>
      </div>
    </div>
  );
}

export default SignupPage;
