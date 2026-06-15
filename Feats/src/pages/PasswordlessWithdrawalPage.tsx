import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance.tsx";

function PasswordlessWithdrawalPage() {
  const [errors, setErrors] = useState("");
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const email = userString ? JSON.parse(userString).email : "";

  const handleWithdrawal = async () => {
    if (!email) {
      alert("로그인 정보가 없습니다.");
      return;
    }

    const isConfirm = window.confirm("정말로 패스워드리스 생체 인증을 해지하시겠습니까?");
    if (!isConfirm) return;

    try {
      // 해지 대상은 서버가 JWT 토큰에서 본인 이메일을 꺼내 판단한다.
      // (email 파라미터는 더 이상 사용하지 않음 — 남의 계정 해지 방지)
      const response = await axios.post("/passwordless/withdrawal", null);

      if (response.data === true) {
        alert("성공적으로 패스워드리스 연동이 해지되었습니다.");
        navigate("/mypage/info");
      } else {
        setErrors("해지 처리에 실패했습니다. 인증 서버의 상태를 확인하세요.");
      }
    } catch (error) {
      setErrors("서버 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>

      {/* 브레드크럼 */}
      <div style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>내 정보</span>
        <span style={{ color: '#ccc' }}>›</span>
        <span style={{ color: '#6abf69', fontWeight: 'bold' }}>패스워드리스 해제</span>
      </div>

      <h2 style={{ color: '#6abf69', fontWeight: 'bold', marginBottom: '24px' }}>패스워드리스 해제</h2>

      {/* 카드 */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '32px',
        background: '#fff'
      }}>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
          등록된 기기와의 인증 연동을 영구적으로 해제합니다.
        </p>

        {/* 이메일 표시 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: '500', marginBottom: '5px' }}>
            해제할 계정 이메일
          </div>
          <input
            type="text"
            value={email || '이메일 정보 없음'}
            readOnly
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: '13px',
              border: '0.5px solid #ccc',
              borderRadius: '6px',
              background: '#fafafa',
              color: '#888',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: 'not-allowed',
            }}
          />
        </div>

        {/* 안내 문구 */}
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '14px 16px',
          fontSize: '13px',
          color: '#92400e',
          marginBottom: '24px',
          lineHeight: '1.7'
        }}>
          • 해제 시 스마트폰을 통한 간편 로그인을 사용할 수 없습니다.<br />
          • 다시 사용하려면 <strong>새로운 QR 코드 발급을 통해 재등록</strong>해야 합니다.
        </div>

        {/* 에러 메시지 */}
        {errors && (
          <div style={{ fontSize: '13px', color: '#dc3545', marginBottom: '16px' }}>
            {errors}
          </div>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/mypage/info')}
            style={{
              flex: 1, padding: '10px', fontSize: '13px',
              borderRadius: '6px', cursor: 'pointer',
              background: '#6c757d', color: '#fff',
              border: 'none', fontWeight: '500'
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleWithdrawal}
            style={{
              flex: 1, padding: '10px', fontSize: '13px',
              borderRadius: '6px', cursor: 'pointer',
              background: '#dc3545', color: '#fff',
              border: 'none', fontWeight: '500'
            }}
          >
            연동 해지하기
          </button>
        </div>
      </div>

    </Container>
  );
}

export default PasswordlessWithdrawalPage;