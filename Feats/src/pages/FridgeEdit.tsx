import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const FridgeEdit = () => {
  const { id } = useParams(); // 어떤 재료인지 ID만 확인
  const navigate = useNavigate();

  // 입력값 관리를 위한 간단한 상태
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const onSave = () => {
    alert(`${id}번 재료(${name})가 저장되었습니다.`);
    navigate('/product/insert'); // 저장 후 목록으로 돌아가기
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>재료 수정 (ID: {id})</h3>
      <hr />
      
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block' }}>재료명</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="예: 우유"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block' }}>수량</label>
        <input 
          type="text" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          placeholder="예: 1개"
        />
      </div>

      <button onClick={onSave} style={{ marginRight: '10px' }}>저장</button>
      <button onClick={() => navigate(-1)}>취소</button>
    </div>
  );
};

export default FridgeEdit;