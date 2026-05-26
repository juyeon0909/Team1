import React, { useState } from 'react';

function Delete() {
  console.log('회원 탈퇴 컴포넌트 렌더링');

  // 1. 상태(State) 정의
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. 회원 탈퇴 버튼 클릭 시 실행될 함수 생성
  const handleDelete = async () => {
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      // 이 부분에 실제 백엔드 API 주소를 넣으셔야 합니다.
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        alert('회원 탈퇴가 완료되었습니다.');
        // 탈퇴 성공 후 페이지 이동 등의 로직 추가
      } else {
        // 백엔드에서 500이나 400 에러를 뱉으면 이쪽으로 들어옵니다.
        alert('탈퇴 처리 중 오류가 발생했습니다. (서버 에러)');
      }
    } catch (error) {
      console.error('네트워크 에러:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  // 스타일 정의

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: 'var(--color-text-secondary, #555)',
    marginBottom: '5px',
    fontWeight: '500',
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    border: '0.5px solid var(--color-border-secondary, #ccc)',
    borderRadius: 'var(--border-radius-md, 6px)',
    background: 'var(--color-background-secondary, #fafafa)',
    color: 'var(--color-text-primary, #111)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}> 이메일 *</label>
        <input
          style={inputStyle}
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" 예: aaa@aaa.com "
        />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}> 비밀번호 *</label>
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" 예: 1234asdf "
        />
      </div>

      {/* onClick에 Delete 대신 새로 만든 handleDelete 함수를 연결합니다 */}
      <button
        type="button"
        onClick={handleDelete}
        style={{
          padding: '8px 18px',
          fontSize: '13px',
          borderRadius: 'var(--border-radius-md, 6px)',
          cursor: 'pointer',
          background: '#1D9E75',
          color: '#fff',
          border: 'none',
          fontWeight: '500'
        }}
      >
        회원 탈퇴
      </button>
    </>
  );
}

export default Delete;