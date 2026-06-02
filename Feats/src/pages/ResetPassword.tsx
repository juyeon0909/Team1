import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance.tsx';

function ResetPassword() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  // 1. 이름 + 이메일 확인
  const handleVerify = async () => {
    if (!name || !email) {
      alert('이름과 이메일을 모두 입력해주세요.');
      return;
    }
    try {
      await axios.post('/member/reset-password/verify', { name, email });
      alert('본인 확인이 완료되었습니다. 새 비밀번호를 입력해주세요.');
      setIsVerified(true);
    } catch (error: any) {
      handleAxiosError(error, '본인 확인에 실패했습니다.');
    }
  };

  // 2. 초기화
  const handleReset = async () => {
    if (!isVerified) {
      alert('본인 확인을 먼저 완료해주세요.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      alert('비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await axios.post('/member/reset-password/reset', { name, email, newPassword });
      alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
      navigate('/member/login');
    } catch (error: any) {
      handleAxiosError(error, '비밀번호 변경에 실패했습니다.');
    }
  };

  // 공통 에러 처리
  const handleAxiosError = (error: any, fallback: string) => {
    console.error(error);
    if (error.response) {
      if (error.response.status === 404) {
        alert(error.response.data.message || '일치하는 회원 정보가 없습니다.');
      } else if (error.response.status === 400 || error.response.status === 403) {
        alert(error.response.data.message || fallback);
      } else {
        alert(`${fallback} (${error.response.data.message || '서버 오류'})`);
      }
    } else {
      alert('서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    border: '0.5px solid #ccc',
    borderRadius: '6px',
    background: '#fafafa',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: '12px',
    color: '#555',
    fontWeight: '500',
    marginBottom: '5px',
  };

  return (
    <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      {/* 브레드크럼 */}
      <div style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/member/login')}>로그인</span>
        <span style={{ color: '#ccc' }}>›</span>
        <span style={{ color: '#6abf69', fontWeight: 'bold' }}>비밀번호 찾기</span>
      </div>

      <h2 style={{ color: '#6abf69', fontWeight: 'bold', marginBottom: '24px' }}>비밀번호 초기화</h2>

      <div style={{
        maxWidth: '500px', margin: '0 auto',
        border: '1px solid #e2e8f0', borderRadius: '10px',
        padding: '32px', background: '#fff'
      }}>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          가입 시 입력한 이름과 이메일을 확인한 뒤 새 비밀번호를 설정할 수 있습니다.
        </p>

        {/* 이름 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>이름</div>
          <input
            style={inputStyle}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="가입 시 입력한 이름"
            disabled={isVerified}
          />
        </div>

        {/* 이메일 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>이메일</div>
          <input
            style={inputStyle}
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: aaa@aaa.com"
            disabled={isVerified}
          />
        </div>

        {/* 본인 확인 버튼 (확인 전에만) */}
        {!isVerified && (
          <button
            type="button"
            onClick={handleVerify}
            style={{
              width: '100%', padding: '10px', fontSize: '13px', borderRadius: '6px',
              cursor: 'pointer', border: 'none', background: '#6abf69', color: '#fff',
              fontWeight: '500', marginBottom: '16px'
            }}
          >
            본인 확인
          </button>
        )}

        {/* 인증 완료 후 새 비밀번호 */}
        {isVerified && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={labelStyle}>새 비밀번호</div>
              <input
                style={inputStyle}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={labelStyle}>새 비밀번호 확인</div>
              <input
                style={inputStyle}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
              />
            </div>
          </>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/member/login')}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', borderRadius: '6px',
              cursor: 'pointer', background: '#6c757d', color: '#fff',
              border: 'none', fontWeight: '500'
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isVerified}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', borderRadius: '6px',
              cursor: isVerified ? 'pointer' : 'not-allowed',
              background: isVerified ? '#6abf69' : '#ccc', color: '#fff',
              border: 'none', fontWeight: '500'
            }}
          >
            비밀번호 변경
          </button>
        </div>
      </div>
    </Container>
  );
}

export default ResetPassword;