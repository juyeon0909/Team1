import React, { useState, useEffect, type ChangeEvent } from 'react';
import "../components/MyPageEdit.css";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import customAxios from './../api/axiosInstance'; // 사용자 정의 axios 인스턴스
import { API_BASE_URL } from "../config/config";

interface EditPageProps {
  nickname: string;
  triggerToast: (msg: string) => void;
}

function MyPageEdit({ nickname, triggerToast }: EditPageProps) {
  const navigate = useNavigate();
  const [editTab, setEditTab] = useState<'nickname' | 'password'>('nickname');

  // 1. 서버에 전송할 데이터 상태 관리 (참고 코드의 product 방식 적용)
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newNickname: '',
    newPassword: '', 
    confirmPassword: ''
  });

  // 2. 에러 메시지 상태 관리 (참고 코드의 errors 방식 적용)
  const initialErrors = {
    newNickname: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  };
  const [errors, setErrors] = useState(initialErrors);

  // 힌트 및 강도 UI 상태
  const [nickHint, setNickHint] = useState<{ text: string; className: string }>({
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

  // 입력 컨트롤 값 변경 함수 (참고 코드의 ControlChange 방식)
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  // ✅ 1. 닉네임 유효성 검사 useEffect
  useEffect(() => {
    const val = formValues.newNickname.trim();
    if (!val) {
      setNickHint({ text: '2~10자 이내로 입력해 주세요.', className: 'hint' });
    } else if (val.length < 2) {
      setNickHint({ text: '닉네임이 너무 짧아요.', className: 'hint err' });
    } else if (val.length > 10) {
      setNickHint({ text: '닉네임이 너무 길어요. (최대 10자)', className: 'hint err' });
    } else {
      setNickHint({ text: '사용 가능한 닉네임이에요 ✅', className: 'hint ok' });
    }
  }, [formValues.newNickname]);

  // ✅ 2. 비밀번호 강도 검사 useEffect
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

  // ✅ 3. 비밀번호 확인 일치 검사 useEffect
  useEffect(() => {
    const { newPassword, confirmPassword } = formValues;
    if (!confirmPassword) {
      setConfirmHint({ text: '', className: 'hint' });
    } else if (confirmPassword === newPassword) {
      setConfirmHint({ text: '비밀번호가 일치해요 ✅', className: 'hint ok' });
    } else {
      setConfirmHint({ text: '비밀번호가 일치하지 않아요.', className: 'hint err' });
    }
  }, [formValues.confirmPassword, formValues.newPassword]);


  // ✅ 닉네임 변경 서버 전송 처리 (SubmitAction 방식)
  const handleNicknameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors(initialErrors); // 에러 초기화

    if (nickHint.className.includes('err') || !formValues.newNickname.trim()) {
      alert("닉네임 형식을 확인해 주세요.");
      return;
    }

    try {
      const url = `${API_BASE_URL}/user/update-nickname`; // 임의의 API 주소 (필요시 백엔드에 맞게 수정하세요)
      const response = await customAxios.post(url, { newNickname: formValues.newNickname });

      triggerToast('닉네임이 변경되었습니다 ✅');
      navigate('/mypage/info');
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response) {
        setErrors((prev) => ({
          ...prev,
          ...error.response?.data?.errors,
          general: error.response?.data?.message || '닉네임 변경 중 오류가 발생했습니다.'
        }));
      } else {
        setErrors((prev) => ({ ...prev, general: '서버와의 통신 중 오류가 발생했습니다.' }));
      }
    }
  };

  // ✅ 비밀번호 변경 서버 전송 처리 (SubmitAction 방식)
  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors(initialErrors); // 에러 초기화

    if (confirmHint.className.includes('err') || !formValues.newPassword || !formValues.currentPassword) {
      alert("비밀번호 정보를 올바르게 입력해 주세요.");
      return;
    }

    try {
      const url = `${API_BASE_URL}/user/update-password`; // 임의의 API 주소 (필요시 백엔드에 맞게 수정하세요)
      await customAxios.post(url, {
        currentPassword: formValues.currentPassword,
        newPassword: formValues.newPassword
      });

      triggerToast('비밀번호가 변경되었습니다 🔒');
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
    <div className="page active">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span className="link" onClick={() => navigate('/mypage/info')}>내 정보</span>
            {' '}<span>›</span> <span className="cur">정보 수정</span>
          </div>
          <h1 className="page-title">내 정보 <span>수정</span></h1>
        </div>
      </div>

      {/* 글로벌 에러 메시지창 표시 (참고 코드 반영) */}
      {errors.general && (
        <div className="alert alert-danger" style={{ color: 'red', marginBottom: '15px', padding: '10px', border: '1px solid red', borderRadius: '5px' }}>
          {errors.general}
        </div>
      )}

      {/* 탭 전환 버튼 */}
      <div className="edit-tabs">
        <button
          className={`edit-tab ${editTab === 'nickname' ? 'active' : ''}`}
          onClick={() => { setEditTab('nickname'); setErrors(initialErrors); }}
        >
          닉네임 수정
        </button>
        <button
          className={`edit-tab ${editTab === 'password' ? 'active' : ''}`}
          onClick={() => { setEditTab('password'); setErrors(initialErrors); }}
        >
          비밀번호 변경
        </button>
      </div>

      {/* 닉네임 수정 탭 */}
      {editTab === 'nickname' && (
        <form onSubmit={handleNicknameSubmit} className="card">
          <div className="card-header">
            <div className="icon">😊</div>
            <h2>닉네임 수정</h2>
          </div>
          <div className="card-body">
            <div className="form-field">
              <label>현재 닉네임</label>
              <input
                type="text"
                value={nickname}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-field">
              <label>새 닉네임</label>
              <input
                type="text"
                name="newNickname"
                value={formValues.newNickname}
                placeholder="변경할 닉네임을 입력하세요"
                onChange={handleInputChange}
                className={errors.newNickname ? 'is-invalid' : ''}
              />
              <div className={nickHint.className}>{nickHint.text}</div>
              {errors.newNickname && <div style={{ color: 'red', fontSize: '12px' }}>{errors.newNickname}</div>}
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
            <div className="icon">🔒</div>
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
  );
}

export default MyPageEdit;