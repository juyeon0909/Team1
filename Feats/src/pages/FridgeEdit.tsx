import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../components/FridgeRegister.css'; // 기존 등록창 CSS 그대로 연동
import axiosInstance from '../api/axiosInstance.tsx';

const FridgeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();

  // 입력값 관리를 위한 상태 생성 (나중에 DB 연동 시 이 useState의 초기값에 값을 넣기)
  const [itemname, setItemName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [category, setCategory] = useState<string>("신선식품"); // 기본값
  const [storagetype, setStoragetype] = useState<string>("REFRIGERATED");


  useEffect(() => {
    if (id) {
      axiosInstance.get(`/product/detail/${id}`) // 백엔드 상세조회 API 주소 (팀원 규칙에 맞게 확인 필요)
        .then((res) => {
          const item = res.data;
          setItemName(item.itemname || item.name || "");
          setQuantity(item.quantity ? String(item.quantity) : "");
          
          if (item.expiry || item.expirationdate) {
            const rawDate = item.expiry || item.expirationdate;
            setExpiry(typeof rawDate === 'string' ? rawDate.substring(0, 10) : "");
          }
          setCategory(item.category || "신선식품");
          const rawType = item.type || item.storagetype;
          if (rawType) {
            if (rawType === '냉장' || rawType === 'REFRIGERATED') setStoragetype('REFRIGERATED');
            else if (rawType === '냉동' || rawType === 'FROZEN') setStoragetype('FROZEN');
            else if (rawType === '실온' || rawType === 'ROOM_TEMP') setStoragetype('ROOM_TEMP');
          }
        })
        .catch((err) => {
          console.error("기존 재료 정보를 가져오는 데 실패했습니다:", err);
        });
    }
  }, [id]);


  const handleSave = async (): Promise<void> => {
    // 정석 유효성 검사 복구
    if (!itemname || !quantity || !expiry) {
      alert("모든 항목을 입력해주세요!");
      return;
    } 

    try {
      // 백엔드 @PostMapping("/update/{id}") 구조 및 ProductDto 필드명과 100% 매핑
      await axiosInstance.post(`/product/update/${id}`, {
        name: itemname,           
        quantity: Number(quantity), 
        expiry: expiry,           
        type: storagetype,
        storagetype: storagetype,        
        category: category        
      });

      alert(`[${itemname}] 재료가 성공적으로 수정되었습니다!`);
      navigate('/product/insert'); 
    } catch (error) {
      console.error("🚨 진짜 서버 에러 내용:", error);
      alert("수정 저장 중 오류가 발생했습니다.");
    }
  };
    

  const handleCancel = (): void => {
    navigate('/product/insert'); // 취소 시 목록 페이지로 이동
  };

  return (
    <div className="fridge-form-container">
      <div className="fridge-form-card">
        
        {/* 헤더 영역 */}
        <div style={{ marginBottom: '25px' }}>
          <h3 className="fridge-form-title">
            재료 수정 {id && <span className="fridge-form-title-id">(ID: {id})</span>}
          </h3>
          <p className="fridge-form-subtitle">
            보관 중인 재료의 변경된 정보를 수정합니다.
          </p>
        </div>

        <hr className="fridge-form-divider" />

        {/* 카테고리 선택창 */}
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

        {/* 재료명 입력창 */}
        <div className="fridge-form-group">
          <label className="fridge-form-label">재료명</label>
          <input
            type="text"
            className="fridge-form-input"
            value={itemname}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="예: 우유, 대파 등"
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

        {/* 유통기한 입력창 */}
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
            저장
          </button>
        </div>

      </div>
    </div>
  );
};

export default FridgeEdit;