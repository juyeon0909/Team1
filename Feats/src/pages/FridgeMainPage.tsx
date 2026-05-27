import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; 
import '../components/FridgeMain.css';

interface Ingredient {
  id: number;
  name: string;
  itemname?: string;       
  quantity: number;
  expirationdate: string;
  expiry?: string;        
  storagetype: string;     
  type?: string;    
}

const FridgeMain: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  const [refSort, setRefSort] = useState<string>("유통기한순"); 
  const [froSort, setFroSort] = useState<string>("유통기한순"); 
  const [roomSort, setRoomSort] = useState<string>("유통기한순"); 

  // 냉장고 전체 보관 목록 조회
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);

    axiosInstance
      .get<Ingredient[]>(`/product/list/${user.id}`)
      .then((res) => {
        setIngredients(res.data);
      })
      .catch((error) => console.error('냉장고 데이터를 가져오는 중 오류 발생:', error));
  }, []);

  // 식재료 삭제 처리
  const handleDelete = async (id: number, name: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();

    if (!window.confirm(`[${name}] 재료를 삭제하시겠습니까?`)) return;

    try {
      await axiosInstance.post(`/product/delete/${id}`, {});
      alert(`[${name}] 재료가 성공적으로 삭제되었습니다.`);
      setIngredients(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("재료 삭제 중 에러 발생:", error);
      alert("재료를 삭제하는 중 오류가 발생했습니다.");
    }
  };

  // 유통기한 디스플레이 클래스 계산
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

  // 조건별 정렬 처리 함수
  const sortIngredients = (list: Ingredient[], sortType: string) => {
    return [...list].sort((a, b) => {
      const nameA = a.itemname || a.name || '';
      const nameB = b.itemname || b.name || '';

      if (sortType === "가나다순") {
        return nameA.localeCompare(nameB, 'ko');
      }
      if (sortType === "재고순") {
        return b.quantity - a.quantity; 
      }
      if (sortType === "유통기한순") {
        if (!a.expirationdate) return 1;
        if (!b.expirationdate) return -1;
        return new Date(a.expirationdate).getTime() - new Date(b.expirationdate).getTime(); 
      }
      return 0;
    });
  };

  // 이름 검색 필터링
  const filteredIngredients = ingredients.filter((item) => {
    const targetName = item.itemname || item.name || '';
    return targetName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 보관 방법별 격리 및 정렬
  const frozenItems = sortIngredients(
    filteredIngredients.filter((item) => {
      const sType = (item.storagetype || item.type || '').toUpperCase();
      return sType === 'FROZEN' || sType === '냉동';
    }),
    froSort
  );

  const refrigeratedItems = sortIngredients(
    filteredIngredients.filter((item) => {
      const sType = (item.storagetype || item.type || '').toUpperCase();
      return sType === 'REFRIGERATED' || sType === '냉장';
    }),
    refSort
  );

  const roomItems = sortIngredients(
    filteredIngredients.filter((item) => {
      const sType = (item.storagetype || item.type || '').toUpperCase();
      return sType === 'ROOM_TEMP' || sType === '실온' || sType === '상온';
    }),
    roomSort
  );

  const renderSortSelect = (value: string, onChangeFn: (val: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChangeFn(e.target.value)}
      className="room-sort-select"
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
          <span className="search-icon">🔍</span>
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
          <div className="room-header frozen-theme room-header-flex">
            <span className="room-emoji"></span>
            <h3 className="room-title">냉동</h3>
            <span className="room-count">{frozenItems.length}</span>
            {renderSortSelect(froSort, setFroSort)}
          </div>
          <div className="room-list-scroll">
            {frozenItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              frozenItems.map((item) => {
                const finalName = item.itemname || item.name || '이름 없음';
                return (
                  <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expirationdate)}`}>
                    <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                      {finalName}
                    </span>
                    <span className="item-quantity">{item.quantity}개</span>
                    
                    <span className="item-expiry item-expiry-wrapper">
                      {item.expirationdate}
                      <button 
                        onClick={(e) => handleDelete(item.id, finalName, e)}
                        className="btn-delete-small"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 냉장 보관실 */}
        <div className="storage-room-card">
          <div className="room-header refrigerated-theme room-header-flex">
            <span className="room-emoji"></span>
            <h3 className="room-title">냉장</h3>
            <span className="room-count">{refrigeratedItems.length}</span>
            {renderSortSelect(refSort, setRefSort)}
          </div>
          <div className="room-list-scroll">
            {refrigeratedItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              refrigeratedItems.map((item) => {
                const finalName = item.itemname || item.name || '이름 없음';
                return (
                  <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expirationdate)}`}>
                    <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                      {finalName}
                    </span>
                    <span className="item-quantity">{item.quantity}개</span>
                    
                    <span className="item-expiry item-expiry-wrapper">
                      {item.expirationdate}
                      <button 
                        onClick={(e) => handleDelete(item.id, finalName, e)}
                        className="btn-delete-small"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 상온 보관실 */}
        <div className="storage-room-card">
          <div className="room-header room-theme room-header-flex">
            <span className="room-emoji"></span>
            <h3 className="room-title">상온</h3>
            <span className="room-count">{roomItems.length}</span>
            {renderSortSelect(roomSort, setRoomSort)}
          </div>
          <div className="room-list-scroll">
            {roomItems.length === 0 ? <p className="empty-item-text">재료가 없습니다.</p> : (
              roomItems.map((item) => {
                const finalName = item.itemname || item.name || '이름 없음';
                return (
                  <div key={item.id} className={`storage-item-row ${getExpiryClass(item.expirationdate)}`}>
                    <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>
                      {finalName}
                    </span>
                    <span className="item-quantity">{item.quantity}개</span>
                    
                    <span className="item-expiry item-expiry-wrapper">
                      {item.expirationdate}
                      <button 
                        onClick={(e) => handleDelete(item.id, finalName, e)}
                        className="btn-delete-small"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default FridgeMain;