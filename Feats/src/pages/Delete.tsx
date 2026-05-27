import React, { useState } from 'react';
import axios from 'axios';

function Delete() {
  console.log('회원 탈퇴 컴포넌트 렌더링');

  // 1. 상태(State) 정의
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. 회원 탈퇴 버튼 클릭 시 실행될 함수
  const handleDelete = async () => {
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      // 1. 로컬 스토리지에서 토큰 가져와서 'accessToken'이라는 변수에 저장
      const accessToken = localStorage.getItem('accessToken');

      // 2. axios 요청 보내기
      const response = await axios.post(
        'http://localhost:9000/api/member/delete', // 로컬 주소
        {
          email: email,
          password: password
        },
        {
          headers: {
            // 🚨 변수 이름을 위와 똑같이 'accessToken'으로 맞춰줍니다!
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 200 || response.status === 204) {
        alert('회원 탈퇴가 완료되었습니다.');
        localStorage.removeItem('accessToken'); // 탈퇴 성공 후 토큰 삭제
        window.location.href = '/'; // 메인 페이지로 이동
      }
    } catch (error: any) {
      console.error('탈퇴 처리 중 에러 발생:', error);

      // 서버가 에러 코드를 반환한 경우 (401, 403, 404, 500 등)
      if (error.response) {
        if (error.response.status === 403) {
          alert('권한이 없거나 비밀번호가 틀렸습니다. (403 Forbidden)');
        } else {
          alert(`탈퇴 실패: ${error.response.data.message || '서버 오류가 발생했습니다.'}`);
        }
      } else {
        // 네트워크 연결 자체가 실패한 경우
        alert('서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요. ');
      }
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
      <div style={{ margin: '25px', marginBottom: '14px' }}>
        <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>
          <span className="cur" style={{ color: 'var(--green)' }}> 회원 탈퇴 </span>
        </h2>
      </div>

      <div style={{ margin: '25px', marginBottom: '14px' }}>
        <label style={labelStyle}> 이메일을 입력해주세요 </label>
        <input
          style={inputStyle}
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" 예: aaa@aaa.com "
        />
      </div>

      <div style={{ margin: '25px', marginBottom: '14px' }}>
        <label style={labelStyle}> 비밀번호를 입력해주세요 </label>
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" 예: 1234asdf!Q "
        />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        style={{
          margin: '25px',
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