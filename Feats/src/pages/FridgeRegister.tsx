import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../components/FridgeRegister.css'; //  상단에 CSS 파일 연동

const FridgeRegister: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();

  // 입력값 관리를 위한 상태 생성
  const [name, setName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [category, setCategory] = useState<string>("신선식품") //기본값
  
  const handleSave = (): void => {
    if (!name || !quantity || !expiry) {
      alert("모든 항목을 입력해주세요!");
      return;
    } // 입력 안됏을떄 오류처리
  const quantityText = quantity ? `${quantity}` : '';

    alert(` [${category}] ${name}(이)가 ${quantityText} 저장되었습니다.`);
    
    navigate('/product/register'); // 저장 후 등록 화면으로 돌아가기
    setName("");
    setQuantity("");
    setExpiry("");
    setCategory("신선식품"); // 카테고리는 첫 번째 기본값으로 되돌리기
  
  };


  const handleCancel = (): void => {
    navigate('/product/insert'); // 취소 시 이전 페이지로 이동
  };

  return (
    <div className="fridge-form-container">
      <div className="fridge-form-card">
        
        {/* 헤더 영역 */}
        <div style={{ marginBottom: '25px' }}>
          <h3 className="fridge-form-title">
            재료 등록 {id && <span className="fridge-form-title-id">(ID: {id})</span>}
          </h3>
          <p className="fridge-form-subtitle">
            냉장고에 새로 넣을 신선한 재료 정보를 입력해주세요.
          </p>
        </div>

        <hr className="fridge-form-divider" />

        {/* 카테고리 선택창 추가 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">카테고리</label>
          <select
            className="fridge-form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="신선식품">신선식품</option>
            <option value="유제품">유제품</option>
            <option value="육류">육류</option>
            <option value="어패류">어패류</option>
            <option value="냉동식품">냉동식품</option>
            <option value="기타">기타</option>
          </select>
        </div>


        {/* 재료명 입력창 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">재료명</label>
          <input
            type="text"
            className="fridge-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 서울우유, 대파 등"
          />
        </div>

        {/* 수량 입력창 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">수량</label>
          <input
            type="text"
            className="fridge-form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="예: 1팩, 500g, 3개"
          />
        </div>

        {/*유통기한 입력창 */}
        <div className="fridge-form-group last">
          <label className="fridge-form-label">유통기한</label>
          <input
            type="date"
            className="fridge-form-input"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>

        {/* 버튼 그룹 */}
        <div className="fridge-form-actions">
          <button onClick={handleCancel} className="btn-cancel">
            취소
          </button>
          <button onClick={handleSave} className="btn-save">
            냉장고에 저장
          </button>
        </div>

      </div>
    </div>
  );
};

export default FridgeRegister;