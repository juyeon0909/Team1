import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; //  팀원들과 공유하는 액시오스 인스턴스 경로 확인 필요
import '../components/FridgeMain.css';

interface Ingredient {
  id: number;
  name: string;
  quantity: number; // 💡 백엔드 int 타입에 맞춰 string에서 number로 변경
  expiry: string;   // "YYYY-MM-DD"
  type: 'frozen' | 'refrigerated' | 'room'; // 💡 백엔드 ROOM_TEMP와 싱크 맞춤
}

const FridgeMain: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 💡 [핵심 교정] 초기값을 빈 배열로 비워두고, 백엔드 데이터를 담을 세터(setIngredients)를 깨워냅니다.
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);


  
  // 💡 [컴포넌트 마운트 시 데이터 조회] 화면이 켜지자마자 MySQL 데이터를 긁어옵니다.
  useEffect(() => {
    const fetchStorageItems = async () => {
      try {
        // 백엔드 ProductController의 @GetMapping("/list") 관문을 찌릅니다.
        const response = await axiosInstance.get<Ingredient[]>('/product/list');
        
        // 받아온 진짜 MySQL 데이터를 화면 상태에 저장합니다.
        setIngredients(response.data);
      } catch (error) {
        console.error("냉장고 데이터를 가져오는 중 서버 에러 발생:", error);
      }
    };

    fetchStorageItems();
  }, []);

  // 유통기한 남은 일수(D-Day) 색상 클래스명 반환 로직 (기존 로직 유지)
  const getExpiryClass = (expiryDateStr: string): string => {
    if (!expiryDateStr) return 'expiry-normal';
    const today = new Date('2026-05-22'); // 프로젝트 기준 시뮬레이션 날짜
    const expiry = new Date(expiryDateStr);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return 'expiry-danger';   // 🔴 3일 이내 -> 빨간색
    if (diffDays <= 7) return 'expiry-warning';  // 🟠 7일 이하 -> 주황색
    return 'expiry-normal';                      // 🟢 넉넉함
  };

  // 검색어 필터링 로직
  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 보관 타입별(냉동/냉장/상온)로 분류
  const frozenItems = filteredIngredients.filter((item) => item.type === 'frozen');
  const refrigeratedItems = filteredIngredients.filter((item) => item.type === 'refrigerated');
  const roomItems = filteredIngredients.filter((item) => item.type === 'room');

  return (
    <div className="storage-page-container">
      
      {/* 1. 상단 재료 검색 바 (맨 위에 고정) */}
      <div className="storage-search-section">
        <div className="storage-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="보관 중인 재료를 검색해보세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="storage-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="search-clear-btn">✕</button>
          )}
        </div>
      
          <button 
          className="storage-add-btn"
          onClick={() => navigate('/product/register')} // 👈 팀에서 지정한 라우터 주소로 맞춰주세요!
        >
          <span className="add-icon-small">＋</span> 재료 등록
        </button>
        
      </div>
      

      {/* 2. 보관실 레이아웃 영역 (각각 세로 독립 스크롤) */}
      <div className="storage-rooms-grid">
        
        {/* 냉동 보관실 */}
        <div className="storage-room-card">
          <div className="room-header frozen-theme">
            <span className="room-emoji">❄️</span>
            <h3 className="room-title">냉동 보관실</h3>
            <span className="room-count">{frozenItems.length}</span>
          </div>
          <div className="room-list-scroll">
            {frozenItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              frozenItems.map((item) => (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expiry)}`}>
                  {/*  재료명을 클릭하면 해당 ID를 들고 수정 페이지로 이동 */}
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {item.name}
                  </span>
                  <span className="item-quantity">{item.quantity}</span>
                  <span className="item-expiry">{item.expiry}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 냉장 보관실 */}
        <div className="storage-room-card">
          <div className="room-header refrigerated-theme">
            <span className="room-emoji">💧</span>
            <h3 className="room-title">냉장 보관실</h3>
            <span className="room-count">{refrigeratedItems.length}</span>
          </div>
          <div className="room-list-scroll">
            {refrigeratedItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              refrigeratedItems.map((item) => (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expiry)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {item.name}
                  </span>
                  <span className="item-quantity">{item.quantity}</span>
                  <span className="item-expiry">{item.expiry}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 상온 보관실 */}
        <div className="storage-room-card">
          <div className="room-header room-theme">
            <span className="room-emoji">📦</span>
            <h3 className="room-title">상온 보관실</h3>
            <span className="room-count">{roomItems.length}</span>
          </div>
          <div className="room-list-scroll">
            {roomItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              roomItems.map((item) => (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expiry)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {item.name}
                  </span>
                  <span className="item-quantity">{item.quantity}</span>
                  <span className="item-expiry">{item.expiry}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FridgeMain;