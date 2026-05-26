import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; 
import '../components/FridgeMain.css';

interface Ingredient {
  id: number;
  itemname: string;
  name?: string;          
  quantity: number;
  expirationdate: string;
  expiry?: string;        
  storagetype: '냉장' | '냉동' | '실온';
  type?: string;          
}

const FridgeMain: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  //  구역별 독립된 정렬(Sort) 상태값 (기본값: 유통기한순)
  const [refSort, setRefSort] = useState<string>("유통기한순"); // 냉장 정렬
  const [froSort, setFroSort] = useState<string>("유통기한순"); // 냉동 정렬
  const [roomSort, setRoomSort] = useState<string>("유통기한순"); // 실온 정렬

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);

    axiosInstance
      .get<Ingredient[]>(`/product/list/${user.id}`)
      .then((res) => {
        const normalizedData = res.data.map(item => ({
          ...item,
          itemname: item.name || item.itemname || "이름 없음",
          expirationdate: item.expiry || item.expirationdate || "",
          storagetype: item.type === 'REFRIGERATED' ? '냉장' : 
                       item.type === 'FROZEN' ? '냉동' : 
                       item.type === 'ROOM_TEMP' ? '실온' : item.storagetype,
        }));
        setIngredients(normalizedData);
      })
      .catch((error) => console.error('냉장고 데이터를 가져오는 중 오류 발생:', error));
  }, []);

  const getExpiryClass = (expiryDateStr: string): string => {
    if (!expiryDateStr) return 'expiry-normal';
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return 'expiry-danger';   
    if (diffDays <= 7) return 'expiry-warning';  
    return 'expiry-normal';                      
  };

  // 🟢 공통 정렬 처리 함수 (배열과 정렬 기준을 넣으면 정렬된 배열을 반환)
  const sortIngredients = (list: Ingredient[], sortType: string) => {
    // 원본 배열이 망가지지 않게 shallow copy([...list]) 후 정렬 진행
    return [...list].sort((a, b) => {
      if (sortType === "가나다순") {
        return a.itemname.localeCompare(b.itemname, 'ko');
      }
      if (sortType === "재고순") {
        return b.quantity - a.quantity; // 수량 많은 순 (내림차순)
      }
      if (sortType === "유통기한순") {
        // 날짜가 없는 경우 뒤로 밀기 방어코드
        if (!a.expirationdate) return 1;
        if (!b.expirationdate) return -1;
        return new Date(a.expirationdate).getTime() - new Date(b.expirationdate).getTime(); // 임박한 순 (오름차순)
      }
      return 0;
    });
  };

  // 1차: 검색어 필터링
  const filteredIngredients = ingredients.filter((item) =>
    item.itemname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2차: 보관 방법 분류 + 🟢 3차: 정렬 함수 적용
  const frozenItems = sortIngredients(
    filteredIngredients.filter((item) => item.storagetype === '냉동'),
    froSort
  );

  const refrigeratedItems = sortIngredients(
    filteredIngredients.filter((item) => item.storagetype === '냉장'),
    refSort
  );

  const roomItems = sortIngredients(
    filteredIngredients.filter((item) => item.storagetype === '실온'),
    roomSort
  );

  // 🟢 공통 정렬 드롭박스 컴포넌트 렌더링 함수
  const renderSortSelect = (value: string, onChangeFn: (val: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChangeFn(e.target.value)}
      style={{
        marginLeft: 'auto', 
        padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(0,0,0,0.15)',
        fontSize: '13px',
        cursor: 'pointer',
        backgroundColor: '#fff',
        color: '#333'
      }}
    >
      <option value="유통기한순">유통기한순</option>
      <option value="가나다순">가나다순</option>
      <option value="재고순">재고순</option>
    </select>
  );

  return (
    <div className="storage-page-container">
      
      <div className="storage-search-section">
        <div className="storage-search-box">
          <span className="search-icon"></span>
          <input
            type="text"
            placeholder="보관 중인 재료를 검색해보세요"
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
          onClick={() => navigate('/product/register')}
        >
          <span className="add-icon-small">＋</span> 재료 등록
        </button>
      </div>
      
      <div className="storage-rooms-grid">
        {/* 냉동 보관실 */}
        <div className="storage-room-card">
          <div className="room-header frozen-theme" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span className="room-emoji"></span>
            <h3 className="room-title">냉동</h3>
            <span className="room-count" style={{ marginRight: '10px' }}>{frozenItems.length}</span>
            {/* 🟢 정렬 드롭박스 배치 */}
            {renderSortSelect(froSort, setFroSort)}
          </div>
          <div className="room-list-scroll">
            {frozenItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              frozenItems.map((item) => (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expirationdate)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {item.itemname}
                  </span>
                  <span className="item-quantity">{item.quantity}개</span>
                  <span className="item-expiry">{item.expirationdate}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 냉장 보관실 */}
        <div className="storage-room-card">
          <div className="room-header refrigerated-theme" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span className="room-emoji"></span>
            <h3 className="room-title">냉장</h3>
            <span className="room-count" style={{ marginRight: '10px' }}>{refrigeratedItems.length}</span>
            {/* 🟢 정렬 드롭박스 배치 */}
            {renderSortSelect(refSort, setRefSort)}
          </div>
          <div className="room-list-scroll">
            {refrigeratedItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              refrigeratedItems.map((item) => (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expirationdate)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {item.itemname}
                  </span>
                  <span className="item-quantity">{item.quantity}개</span>
                  <span className="item-expiry">{item.expirationdate}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 상온 보관실 */}
        <div className="storage-room-card">
          <div className="room-header room-theme" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <span className="room-emoji"></span>
            <h3 className="room-title">상온</h3>
            <span className="room-count" style={{ marginRight: '10px' }}>{roomItems.length}</span>
            {/*  정렬 드롭박스 배치 */}
            {renderSortSelect(roomSort, setRoomSort)}
          </div>
          <div className="room-list-scroll">
            {roomItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              roomItems.map((item) => (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expirationdate)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {item.itemname}
                  </span>
                  <span className="item-quantity">{item.quantity}개</span>
                  <span className="item-expiry">{item.expirationdate}</span>
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