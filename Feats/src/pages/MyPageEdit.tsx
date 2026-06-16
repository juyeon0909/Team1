import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap'; // 👈 1. 필수: 누락되었던 부트스트랩 Container 컴포넌트 import 추가
import "../components/MyPageEdit.css";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import customAxios from './../api/axiosInstance'; 

interface EditPageProps {
  name: string; 
  setName: (name: string) => void;
  triggerToast: (msg: string) => void;
}

function MyPageEdit({ name, setName, triggerToast }: EditPageProps) {
  const navigate = useNavigate();
  const [editTab, setEditTab] = useState<'name' | 'password'>('name'); 

  // 서버에 전송할 데이터 상태 관리
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newName: '', 
    newPassword: '', 
    confirmPassword: ''
  });

  // 에러 메시지 상태 관리
  const initialErrors = {
    newName: '', 
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  };
  const [errors, setErrors] = useState(initialErrors);

  // 힌트 및 강도 UI 상태
  const [nameHint, setNameHint] = useState<{ text: string; className: string }>({ 
    text: '2~10자 이내로 입력해 주세요.',
    className: 'hint',
  });
  const [pwStrength, setPwStrength] = useState<{ score: number; label: string; color: string }>({
    score: 0,
    label: '—',
    color: 'var(--text-light)',
  });
  const [confirmHint, setConfirmHint] = useState<{ text: string; className: string }>({
    text: '',
    className: 'hint',
  });

  // 입력 컨트롤 값 변경 함수
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  // 이름 유효성 검사
  useEffect(() => {
    const val = formValues.newName.trim();
    if (!val) {
      setNameHint({ text: '2~10자 이내로 입력해 주세요.', className: 'hint' });
    } else if (val.length < 2) {
      setNameHint({ text: '이름이 너무 짧아요.', className: 'hint err' });
    } else if (val.length > 10) {
      setNameHint({ text: '이름이 너무 길어요. (최대 10자)', className: 'hint err' });
    } else {
      setNameHint({ text: '사용 가능한 이름이에요.', className: 'hint ok' });
    }
  }, [formValues.newName]);

  // 비밀번호 강도 검사
  useEffect(() => {
    const { newPassword } = formValues;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    const txtMap = ['—', '약함', '보통', '강함'];
    const colMap = ['var(--text-light)', 'var(--red)', '#f5a623', 'var(--green)'];
    
    setPwStrength({ score, label: txtMap[score], color: colMap[score] });
  }, [formValues.newPassword]);

  // 비밀번호 확인 일치 검사
  useEffect(() => {
    const { newPassword, confirmPassword } = formValues;
    if (!confirmPassword) {
      setConfirmHint({ text: '', className: 'hint' });
    } else if (confirmPassword === newPassword) {
      setConfirmHint({ text: '비밀번호가 일치해요.', className: 'hint ok' });
    } else {
      setConfirmHint({ text: '비밀번호가 일치하지 않아요.', className: 'hint err' });
    }
  }, [formValues.confirmPassword, formValues.newPassword]);

  // 이름 변경 서버 전송
  const handleNameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors(initialErrors); 

    if (nameHint.className.includes('err') || !formValues.newName.trim()) {
      alert("이름 형식을 확인해 주세요.");
      return;
    }

    try {
      await customAxios.put('/mypage/update-name', { newName: formValues.newName });
      setName(formValues.newName);
      triggerToast('이름이 변경되었습니다.');
      navigate('/mypage/info');
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response) {
        setErrors((prev) => ({
          ...prev,
          ...error.response?.data?.errors,
          general: error.response?.data?.message || '이름 변경 중 오류가 발생했습니다.'
        }));
      } else {
        setErrors((prev) => ({ ...prev, general: '서버와의 통신 중 오류가 발생했습니다.' }));
      }
    }
  };

  // 비밀번호 변경 서버 전송
  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors(initialErrors); 

    if (confirmHint.className.includes('err') || !formValues.newPassword || !formValues.currentPassword) {
      alert("비밀번호 정보를 올바르게 입력해 주세요.");
      return;
    }

    try {
      await customAxios.put('/mypage/update-password', {
        currentPassword: formValues.currentPassword,
        newPassword: formValues.newPassword
      });
      triggerToast('비밀번호가 변경되었습니다.');
      navigate('/mypage/info');
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response) {
        setErrors((prev) => ({
          ...prev,
          ...error.response?.data?.errors,
          general: error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.'
        }));
      } else {
        setErrors((prev) => ({ ...prev, general: '서버와의 통신 중 오류가 발생했습니다.' }));
      }
    }
  };

  return (
    <Container className="py-4"> {/* 👈 상단 열기 태그와 완벽 매칭 */}
      <div className="page active">
        
        {/* 2. 겉돌던 중복 page-header 구조를 정리하고, 세로 정렬(column) 적용하여 겹침 현상 해결 */}
        <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '20px' }}>
  
        {/* 상단 경로 */}
        <div className="breadcrumb" style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
          <span className="link" style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>
            내 정보
          </span>
          <span style={{ color: '#ccc' }}>›</span>
          <span className="cur" style={{ color: '#6abf69', fontWeight: 'bold' }}>정보 수정</span>
        </div>
  
        {/* 한 칸 아래로 온전하게 떨어지는 메인 타이틀 */}
          <h1 className="page-title" style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', textAlign: 'left' }}>
            내 정보 <span style={{ color: '#6abf69' }}>수정</span>
          </h1>
        </div>

        {/* 글로벌 에러 메시지창 */}
        {errors.general && (
          <div className="alert alert-danger" style={{ color: 'red', marginBottom: '15px', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
            {errors.general}
          </div>
        )}

        {/* 탭 전환 버튼 */}
        <div className="edit-tabs">
          <button
            className={`edit-tab ${editTab === 'name' ? 'active' : ''}`}
            onClick={() => { setEditTab('name'); setErrors(initialErrors); }}
          >
            이름 수정
          </button>
          <button
            className={`edit-tab ${editTab === 'password' ? 'active' : ''}`}
            onClick={() => { setEditTab('password'); setErrors(initialErrors); }}
          >
            비밀번호 변경
          </button>
        </div>

        {/* 이름 수정 탭 */}
        {editTab === 'name' && (
          <form onSubmit={handleNameSubmit} className="card">
            <div className="card-header">
              <h2>이름 수정</h2>
            </div>
            <div className="card-body">
              <div className="form-field">
                <label>현재 이름</label>
                <input
                  type="text"
                  value={name} 
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-field">
                <label>새 이름</label>
                <input
                  type="text"
                  name="newName" 
                  value={formValues.newName}
                  placeholder="변경할 이름을 입력하세요"
                  onChange={handleInputChange}
                  className={errors.newName ? 'is-invalid' : ''}
                />
                <div className={nameHint.className}>{nameHint.text}</div>
                {errors.newName && <div style={{ color: 'red', fontSize: '12px' }}>{errors.newName}</div>}
              </div>
              <div className="btn-row">
                <button type="submit" className="btn-go">
                  저장하기
                </button>
                <button type="button" className="btn-back" onClick={() => navigate('/mypage/info')}>
                  취소
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 비밀번호 변경 탭 */}
        {editTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="card">
            <div className="card-header">
              <h2>비밀번호 변경</h2>
            </div>
            <div className="card-body">
              <div className="form-field">
                <label>현재 비밀번호</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={formValues.currentPassword}
                  placeholder="현재 비밀번호를 입력하세요" 
                  onChange={handleInputChange}
                />
                {errors.currentPassword && <div style={{ color: 'red', fontSize: '12px' }}>{errors.currentPassword}</div>}
              </div>
              <div className="form-field">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formValues.newPassword}
                  placeholder="새 비밀번호를 입력하세요"
                  onChange={handleInputChange}
                />
                <div className="pw-strength-box">
                  <div className={`pw-bar ${pwStrength.score >= 1 ? (pwStrength.score === 1 ? 'weak' : pwStrength.score === 2 ? 'mid' : 'strong') : ''}`} />
                  <div className={`pw-bar ${pwStrength.score >= 2 ? (pwStrength.score === 2 ? 'mid' : 'strong') : ''}`} />
                  <div className={`pw-bar ${pwStrength.score === 3 ? 'strong' : ''}`} />
                  <span className="pw-lbl" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
                <div className="hint">영문·숫자·특수문자 조합 8자 이상 권장</div>
                {errors.newPassword && <div style={{ color: 'red', fontSize: '12px' }}>{errors.newPassword}</div>}
              </div>
              <div className="form-field">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formValues.confirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  onChange={handleInputChange}
                />
                <div className={confirmHint.className}>{confirmHint.text}</div>
                {errors.confirmPassword && <div style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPassword}</div>}
              </div>
              <div className="btn-row">
                <button type="submit" className="btn-go">
                  변경하기
                </button>
                <button type="button" className="btn-back" onClick={() => navigate('/mypage/info')}>
                  취소
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Container>
  );
}

export default MyPageEdit;