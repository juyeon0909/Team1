import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance.tsx";
import "../components/LoginPage.css";

function PasswordlessRegisterPage() {
  const [qrCode, setQrCode] = useState<string>("");
  const [errors, setErrors] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const loggedInEmail = userString ? JSON.parse(userString).email : "";

  useEffect(() => {
    if (loggedInEmail) {
      fetchQrCode(loggedInEmail);
    }
  }, [loggedInEmail]);

  const fetchQrCode = async (email: string) => {
    setErrors("");
    try {
      const response = await axios.post("/passwordless/register", null, {
        params: { email }
      });
      setQrCode(response.data.qr);
    } catch (error) {
      setErrors("QR 코드 발급에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail) return;
    fetchQrCode(inputEmail);
  };

  return (
    <div className="login-page-container" style={{ justifyContent: "center" }}>
      <div className="login-form-section" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="login-form-header">
          <h2>패스워드리스 기기 등록</h2>
          <p>X1280 앱을 켜고 아래 QR 코드를 스캔해 주세요 </p>
        </div>

        {errors && <Alert variant="danger">{errors}</Alert>}

        {!loggedInEmail && !qrCode && (
          <form onSubmit={handleEmailSubmit}>
            <div className="custom-input-group">
              <label className="custom-input-label">이메일</label>
              <input
                type="email"
                className="custom-form-control"
                placeholder="등록할 계정 이메일을 입력하세요"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit-green">
              QR 코드 발급
            </button>
          </form>
        )}

        {qrCode && (
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <img
              src={qrCode}
              alt="등록용 QR 코드"
              style={{ width: "200px", height: "200px", border: "1px solid #ddd", borderRadius: "10px" }}
            />
          </div>
        )}

        {loggedInEmail && !qrCode && (
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <p>QR 코드를 불러오는 중입니다...</p>
          </div>
        )}

        {qrCode && (
          <button
            className="btn-submit-green"
            onClick={() => navigate("/member/login", { state: { mode: "passwordless" } })}
          >
            등록 완료 / 로그인하기
          </button>
        )}

        <button
          className="btn-submit-green"
          style={{ backgroundColor: "#6c757d", marginTop: "10px" }}
          onClick={() => navigate("/member/login")}
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PasswordlessRegisterPage;