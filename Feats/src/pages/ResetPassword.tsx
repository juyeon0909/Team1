import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance.tsx';

type PwStrength = { width: string; color: string; label: string; labelColor: string };

function ResetPassword() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [pwStrength, setPwStrength] = useState<PwStrength>({
    width: '0%', color: '#eee', label: '영문, 숫자, 특수문자 포함 8자 이상', labelColor: '#aaa',
  });
  const [matchMsg, setMatchMsg] = useState({ text: '', color: '' });

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;




  // 1. 이름 + 이메일 확인
  const handleVerify = async () => {
    if (!name || !email) {
      alert('이름과 이메일을 모두 입력해주세요.');
      return;
    }
    try {
      await axios.post('/member/reset-password/send', { name, email });
      alert('입력하신 이메일로 인증번호 6자리가 발송되었습니다. 메일함을 확인해주세요.');
      setIsCodeSent(true); 
    } catch (error: any) {
      handleAxiosError(error, '본인 확인 및 이메일 발송에 실패했습니다.');
    }
  };
  const handleVerifyCode = async () => {
    if (!code || code.trim().length !== 6) {
      alert('인증번호 6자리를 정확히 입력해주세요.');
      return;
    }
    try {
      // 백엔드 2단계 엔드포인트(/verify-code) 호출
      await axios.post('/member/reset-password/verify-code', { email, code });
      alert('이메일 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.');
      setIsVerified(true); // 새 비밀번호 창 스위치 On!
    } catch (error: any) {
      handleAxiosError(error, '인증번호가 올바르지 않거나 만료되었습니다.');
    }
  };

  // 2. 초기화
  const handleReset = async () => {
    if (!isVerified) {
      alert('이메일 인증을 먼저 완료해주세요.');
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
      alert('비밀번호가 안전하게 재설정되었습니다. 다시 로그인해주세요.');
      navigate('/member/login');
    } catch (error: any) {
      handleAxiosError(error, '비밀번호 변경에 실패했습니다.');
    }
  };

  /* ── 비밀번호 강도 체크 ── */
  const checkStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Za-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const map: Record<number, PwStrength> = {
      0: { width: '0%', color: '#eee', label: '영문, 숫자, 특수문자 포함 8자 이상', labelColor: '#aaa' },
      1: { width: '25%', color: '#e53935', label: '약함', labelColor: '#e53935' },
      2: { width: '50%', color: '#fb8c00', label: '보통', labelColor: '#fb8c00' },
      3: { width: '75%', color: '#fdd835', label: '강함', labelColor: '#b8a200' },
      4: { width: '100%', color: '#4caf50', label: '매우 강함', labelColor: '#4caf50' },
    };
    setPwStrength(map[score]);
  };

  /* ── 비밀번호 일치 체크 ── */
  const checkMatch = (pw: string, pw2: string) => {
    if (!pw2) { setMatchMsg({ text: '', color: '' }); return; }
    if (pw === pw2) setMatchMsg({ text: '비밀번호가 일치합니다', color: '#4caf50' });
    else setMatchMsg({ text: '비밀번호가 일치하지 않습니다', color: '#e53935' });
  };

  /* ── 버튼 활성화 조건 ── */
  const isSubmittable =
    name.trim() !== '' &&
    email.trim() !== '' &&
    code.trim().length === 6 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

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
    fontWeight: 500,
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
          가입 시 입력한 이름과 이메일로 인증한 뒤 새 비밀번호를 설정할 수 있습니다.
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
            disabled={isCodeSent}
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
            disabled={isCodeSent}
          />
        </div>

        {/* 본인 확인 버튼 (확인 전에만) */}
        {!isCodeSent && (
          <button
            type="button"
            onClick={handleVerify}
            style={{
              width: '100%', padding: '10px', fontSize: '13px', borderRadius: '6px',
              cursor: 'pointer', border: 'none', background: '#6abf69', color: '#fff',
              fontWeight: 500, marginBottom: '16px'
            }}
          >
            본인 확인
          </button>
        )}
        {isCodeSent && !isVerified && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
            <div style={labelStyle}>이메일 인증번호 6자리</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 2 }}
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="숫자 6자리 입력"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                style={{
                  flex: 1, padding: '9px', fontSize: '12px', borderRadius: '6px',
                  cursor: 'pointer', border: 'none', background: '#1e293b', color: '#fff',
                  fontWeight: 500
                }}
              >
                인증 확인
              </button>
            </div>
          </div>
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
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkStrength(e.target.value);
                  checkMatch(e.target.value, confirmPassword);
                }}
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              />
              {/* 강도 바 */}
              <div style={{ height: '6px', background: '#eee', borderRadius: '4px', marginTop: '8px' }}>
                <div style={{
                  width: pwStrength.width, height: '100%',
                  background: pwStrength.color, borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: '12px', color: pwStrength.labelColor, marginTop: '4px' }}>
                {pwStrength.label}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={labelStyle}>새 비밀번호 확인</div>
              <input
                style={inputStyle}
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  checkMatch(newPassword, e.target.value);
                }}
                placeholder="비밀번호 재입력"
              />
              {matchMsg.text && (
                <div style={{ fontSize: '12px', color: matchMsg.color, marginTop: '4px' }}>
                  {matchMsg.text}
                </div>
              )}
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
              border: 'none', fontWeight: 500
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isVerified || !isSubmittable}
            style={{
              flex: 1, padding: '10px', fontSize: '13px', borderRadius: '6px',
              cursor: (isVerified && isSubmittable) ? 'pointer' : 'not-allowed',
              background: (isVerified && isSubmittable) ? '#6abf69' : '#ccc', color: '#fff',
              border: 'none', fontWeight: 500
            }}
          >
            비밀번호 변경
          </button>
        </div>
      </div>
    </Container>
  );
}
/* 비밀번호 강도 체크 추가 */
export default ResetPassword;