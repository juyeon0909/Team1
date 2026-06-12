import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Delete() {
  console.log('회원 탈퇴 컴포넌트 렌더링');

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDelete = async () => {
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      const response = await axios.post(
        'http://localhost:9000/api/member/delete',
        { email: email, password: password },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 200 || response.status === 204) {
        alert('회원 탈퇴가 완료되었습니다.');
        localStorage.clear();
        window.location.replace('/member/login');
      }
    } catch (error: any) {
      console.error('탈퇴 처리 중 에러 발생:', error);

      if (error.response) {
        if (error.response.status === 403) {
          alert(error.response.data.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (error.response.status === 401) {
          alert('로그인이 필요합니다.');
        } else {
          alert(`탈퇴 실패: ${error.response.data.message || '서버 오류가 발생했습니다.'}`);
        }
      } else {
        alert('서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
      }
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

  return (
    <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>

      {/* 브레드크럼 */}
      <div style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>내 정보</span>
        <span style={{ color: '#ccc' }}>›</span>
        <span style={{ color: '#6abf69', fontWeight: 'bold' }}>회원 탈퇴</span>
      </div>

      <h2 style={{ color: '#6abf69', fontWeight: 'bold', marginBottom: '24px' }}>회원 탈퇴</h2>

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
          탈퇴 시 모든 계정 정보가 삭제되며 복구할 수 없습니다.
        </p>

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
          • 탈퇴 후 동일한 이메일로 재가입이 제한될 수 있습니다.<br />
          • 레시피 좋아요 및 스크랩 내역이 모두 삭제됩니다.<br />
          • 등록한 레시피는 홈페이지 내에 유지됩니다.
        </div>

        {/* 이메일 입력 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: '500', marginBottom: '5px' }}>
            이메일을 입력해주세요
          </div>
          <input
            style={inputStyle}
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="예: aaa@aaa.com"
          />
        </div>

        {/* 비밀번호 입력 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: '500', marginBottom: '5px' }}>
            비밀번호를 입력해주세요
          </div>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="예: 1234asdf!Q"
          />
        </div>

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
            onClick={handleDelete}
            style={{
              flex: 1, padding: '10px', fontSize: '13px',
              borderRadius: '6px', cursor: 'pointer',
              background: '#dc3545', color: '#fff',
              border: 'none', fontWeight: '500'
            }}
          >
            회원 탈퇴
          </button>
        </div>
      </div>

    </Container>
  );
}

export default Delete;