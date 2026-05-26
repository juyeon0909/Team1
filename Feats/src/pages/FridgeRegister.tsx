import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/FridgeRegister.css';

const FridgeRegister: React.FC = () => {
  const navigate = useNavigate();

  const [itemname, setItemname] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [expirationdate, setExpirationdate] = useState('');
  const [storagetype, setStoragetype] = useState('REFRIGERATED'); // 기본값: 냉장

  const handleSave = async (): Promise<void> => {
    if (!itemname || quantity === '' || !expirationdate) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const stored = localStorage.getItem('user');
    if (!stored) {
      alert('로그인이 필요합니다.');
      navigate('/member/login');
      return;
    }
    const user = JSON.parse(stored);

    try {
      await axiosInstance.post('/product/register', {
        memberId: user.id,
        itemname,
        quantity: Number(quantity),
        expirationdate,
        storagetype,
      });

      alert(`${itemname}이(가) 등록되었습니다.`);
      navigate('/product/insert');
    } catch (error) {
      alert('등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(error);
    }
  };

  const handleCancel = (): void => {
    navigate('/product/insert');
  };

  return (
    <div className="fridge-form-container">
      <div className="fridge-form-card">

        <div style={{ marginBottom: '25px' }}>
          <h3 className="fridge-form-title">재료 등록</h3>
          <p className="fridge-form-subtitle">
            냉장고에 새로 넣을 신선한 재료 정보를 입력해주세요.
          </p>
        </div>

        <hr className="fridge-form-divider" />

        {/* 보관 방법 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">보관 방법</label>
          <select
            className="fridge-form-input"
            value={storagetype}
            onChange={(e) => setStoragetype(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="REFRIGERATED">냉장</option>
            <option value="FROZEN">냉동</option>
            <option value="ROOM_TEMP">실온</option>
          </select>
        </div>

        {/* 재료명 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">재료명</label>
          <input
            type="text"
            className="fridge-form-input"
            value={itemname}
            onChange={(e) => setItemname(e.target.value)}
            placeholder="예: 서울우유, 대파 등"
          />
        </div>

        {/* 수량 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">수량 (개)</label>
          <input
            type="number"
            min={1}
            max={1000}
            className="fridge-form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="예: 3"
          />
        </div>

        {/* 유통기한 */}
        <div className="fridge-form-group last">
          <label className="fridge-form-label">유통기한</label>
          <input
            type="date"
            className="fridge-form-input"
            value={expirationdate}
            onChange={(e) => setExpirationdate(e.target.value)}
          />
        </div>

        <div className="fridge-form-actions">
          <button onClick={handleCancel} className="btn-cancel">취소</button>
          <button onClick={handleSave} className="btn-save">저장</button>
        </div>

      </div>
    </div>
  );
};

export default FridgeRegister;
