import React, { useState } from "react";
import { Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance.tsx";
import "../components/LoginPage.css";

function PasswordlessWithdrawalPage() {
  const [errors, setErrors] = useState("");
  const navigate = useNavigate();

  // 로그인된 유저의 이메일 꺼내오기
  const userString = localStorage.getItem("user");
  const email = userString ? JSON.parse(userString).email : "";

  const handleWithdrawal = async () => {
    if (!email) {
      alert("로그인 정보가 없습니다.");
      return;
    }

    // 진짜 해지할 건지 한 번 더 물어보는 안전장치
    const isConfirm = window.confirm("정말로 패스워드리스 생체 인증을 해지하시겠습니까?");
    if (!isConfirm) return;

    try {
      // 우리가 스프링에서 만든 7단계(withdrawal) API 호출!
      const response = await axios.post("/passwordless/withdrawal", null, {
        params: { email }
      });

      if (response.data === true) {
        alert("성공적으로 패스워드리스 연동이 해지되었습니다.");
        navigate("/"); // 성공 시 메인 페이지로 이동
      } else {
        setErrors("해지 처리에 실패했습니다. 인증 서버의 상태를 확인하세요.");
      }
    } catch (error) {
      setErrors("서버 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="login-page-container" style={{ justifyContent: "center" }}>
      <div className="login-form-section" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="login-form-header">
          <h2>패스워드리스 연동 해지</h2>
          <p>등록된 기기와의 인증 연동을 영구적으로 해제합니다 </p>
        </div>

        {errors && <Alert variant="danger">{errors}</Alert>}

        <div style={{ margin: "30px 0", textAlign: "center", color: "#666" }}>
          <p>해지 시 더 이상 스마트폰을 통한 간편 로그인을 사용할 수 없으며,</p>
          <p>다시 사용하시려면 <strong>새로운 QR 코드 발급을 통해 재등록</strong>해야 합니다.</p>
        </div>

        <button
          className="btn-submit-green"
          style={{ backgroundColor: "#dc3545" }} // 위험한 행동(해지)이므로 빨간색 버튼으로 경고 느낌 부여
          onClick={handleWithdrawal}
        >
          연동 해지하기
        </button>

        <button
          className="btn-submit-green"
          style={{ backgroundColor: "#6c757d", marginTop: "10px" }}
          onClick={() => navigate("/")}
        >
          취소 / 돌아가기
        </button>
      </div>
    </div>
  );
}

export default PasswordlessWithdrawalPage;