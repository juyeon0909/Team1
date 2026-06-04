import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; 
import '../components/FridgeMain.css';
import type { Ingredient } from '../types/Fridge.ts'; 
import type { User } from '../types/User.ts'; 

const FridgeMain: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [refSort, setRefSort] = useState<string>("유통기한순"); 
  const [froSort, setFroSort] = useState<string>("유통기한순"); 
  const [roomSort, setRoomSort] = useState<string>("유통기한순"); 

  const loadData = (userId: number) => {
    axiosInstance
      .get<Ingredient[]>(`/product/list/${userId}`)
      .then((res) => setIngredients(res.data || []))
      .catch((error) => console.error('냉장고 데이터를 가져오는 중 오류 발생:', error));
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user: User = JSON.parse(stored);
      setCurrentUser(user);
      loadData(user.id); // 로그인 된 회원일 때만 백엔드 데이터 수급
    } else {
      setCurrentUser(null);
      setIngredients([]); // 로그아웃 상태면 리스트 클리어
    }
  }, []);

  const handleDelete = async (id: number, name: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    if (!window.confirm(`${name} (을)를 삭제하시겠습니까?`)) return;

    try {
      await axiosInstance.post(`/product/delete/${id}`, {});
      alert(`${name} (이)가 성공적으로 삭제되었습니다.`);
      setIngredients(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("재료 삭제 중 에러 발생:", error);
      alert("재료를 삭제하는 중 오류가 발생했습니다.");
    }
  };

const getExpiryClass = (urgency?: string, dDay?: number): string => {
    if ((dDay !== undefined && dDay <= 0) || urgency === 'urgent') return 'expiry-danger';   
    if (urgency === 'warning') return 'expiry-warning';  
    return 'expiry-normal';                      
  };



  const getShortCategory = (categoryStr?: string): string => {
    if (!categoryStr) return '기'; 
    return categoryStr.trim().charAt(0);
  };

const sortIngredients = (list: Ingredient[], sortType: string) => {
    return [...list].sort((a, b) => {
      const nameA = a.itemName || '';
      const nameB = b.itemName || '';

      if (sortType === "가나다순") return nameA.localeCompare(nameB, 'ko');
      if (sortType === "재고순") return b.quantity - a.quantity; 
      if (sortType === "등록순") return b.id - a.id;
      if (sortType === "유통기한순") {
        const dDayA = a.dDay !== undefined ? a.dDay : 999;
        const dDayB = b.dDay !== undefined ? b.dDay : 999;
        return dDayA - dDayB; 
      }
      return 0;
    });
  };


const filteredIngredients = ingredients.filter((item) => {
    const targetName = (item.itemName || '').toLowerCase();
    const targetCategory = (item.category || '').toLowerCase();
    const search = searchTerm.toLowerCase().trim();
    return targetName.includes(search) || targetCategory.includes(search);
  });


  const todayStr = new Date().toISOString().split("T")[0]; 

const expiredItems = sortIngredients(filteredIngredients.filter(item => {
    // 백엔드 dDay 필드가 존재한다면 최우선 신뢰
    if (item.dDay !== undefined) return item.dDay <= 0;
    

    if (!item.expirationDate) return false;
    return item.expirationDate <= todayStr; 
  }), "유통기한순");

  const freshIngredients = filteredIngredients.filter(item => {
    if (item.dDay !== undefined) return item.dDay > 0;
    
    if (!item.expirationDate) return true; 
    return item.expirationDate > todayStr;
  });

  const frozenItems = sortIngredients(freshIngredients.filter(item => {
    return item.storageType === 'FROZEN';
  }), froSort);

  const refrigeratedItems = sortIngredients(freshIngredients.filter(item => {
    return item.storageType === 'REFRIGERATED';
  }), refSort);

  const roomItems = sortIngredients(freshIngredients.filter(item => {
    return item.storageType === 'ROOM_TEMP';
  }), roomSort);


  const renderSortSelect = (value: string, onChangeFn: (val: string) => void) => (
    <select value={value} onChange={(e) => onChangeFn(e.target.value)} className="room-sort-select" disabled={!currentUser}>
      <option value="유통기한순">유통기한순</option>
      <option value="가나다순">가나다순</option>
      <option value="재고순">재고순</option>
      <option value="등록순">등록순</option>
    </select>
  );

  return (
    <div className="storage-page-container">
      <div className="storage-search-section">
        <div className="storage-search-box">
          <span className="search-icon"></span>
          <input 
            type="text" 
            placeholder={currentUser ? "보관 중인 재료를 검색해보세요" : "로그인 후 검색이 가능합니다"} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="storage-search-input" 
            disabled={!currentUser}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear-btn">✕</button>}
        </div>
        {/*  로그인 상황일 때만 재료 등록 버튼 노출 */}
        {currentUser && (
          <button className="storage-add-btn" onClick={() => navigate('/product/register')}><span className="add-icon-small">＋</span> 재료 등록</button>
        )}
      </div>
      
      <div className="storage-rooms-grid">
        {/* 냉동 보관실 */}
        <div className="storage-room-card">
          <div className="room-header frozen-theme room-header-flex">
            <span className="room-emoji"></span><h3 className="room-title">냉동</h3><span className="room-count">{currentUser ? frozenItems.length : 0}</span>
            {renderSortSelect(froSort, setFroSort)}
          </div>
          <div className="room-list-scroll">
            {/* 로그아웃 핸들러 적용 */}
            {!currentUser ? (
              <p className="empty-item-text" style={{ color: "#94a3b8", fontWeight: "700" }}>로그인 후 이용 가능합니다.</p>
            ) : frozenItems.length === 0 ? (
              <p className="empty-item-text">재료가 없습니다.</p>
            ) : frozenItems.map((item) => {
              const finalName = item.itemName || item.name || '이름 없음';
              return (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.urgency, item.dDay)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>{finalName}</span>
                  <span className="item-badge-short">{getShortCategory(item.category)}</span>
                  <span className="item-quantity">{item.quantity}g</span>
                  {/* <span className="item-expiry item-expiry-wrapper">{item.expirationdate}<button onClick={(e) => handleDelete(item.id, finalName, e)} className="btn-delete-small">✕</button></span> */}
                  <span className="item-expiry item-expiry-wrapper">{item.expirationDate}<button onClick={(e) => handleDelete(item.id, finalName, e)} className="btn-delete-small">✕</button></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 냉장 보관실 */}
        <div className="storage-room-card">
          <div className="room-header refrigerated-theme room-header-flex">
            <span className="room-emoji"></span><h3 className="room-title">냉장</h3><span className="room-count">{currentUser ? refrigeratedItems.length : 0}</span>
            {renderSortSelect(refSort, setRefSort)}
          </div>
          <div className="room-list-scroll">
            {/* 로그아웃 핸들러 적용 */}
            {!currentUser ? (
              <p className="empty-item-text" style={{ color: "#94a3b8", fontWeight: "700" }}>로그인 후 이용 가능합니다.</p>
            ) : refrigeratedItems.length === 0 ? (
              <p className="empty-item-text">재료가 없습니다.</p>
            ) : refrigeratedItems.map((item) => {
              const finalName = item.itemName || item.name || '이름 없음';
              return (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.urgency, item.dDay)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>{finalName}</span>
                  <span className="item-badge-short">{getShortCategory(item.category)}</span>
                  <span className="item-quantity">{item.quantity}g</span>
                  {/* <span className="item-expiry item-expiry-wrapper">{item.expirationdate}<button onClick={(e) => handleDelete(item.id, finalName, e)} className="btn-delete-small">✕</button></span> */}
                  <span className="item-expiry item-expiry-wrapper">{item.expirationDate}<button onClick={(e) => handleDelete(item.id, finalName, e)} className="btn-delete-small">✕</button></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상온 보관실 */}
        <div className="storage-room-card">
          <div className="room-header room-theme room-header-flex">
            <span className="room-emoji"></span><h3 className="room-title">상온</h3><span className="room-count">{currentUser ? roomItems.length : 0}</span>
            {renderSortSelect(roomSort, setRoomSort)}
          </div>
          <div className="room-list-scroll">
            {/* 로그아웃 핸들러 적용 */}
            {!currentUser ? (
              <p className="empty-item-text" style={{ color: "#94a3b8", fontWeight: "700" }}>로그인 후 이용 가능합니다.</p>
            ) : roomItems.length === 0 ? (
              <p className="empty-item-text">재료가 없습니다.</p>
            ) : roomItems.map((item) => {
              const finalName = item.itemName || item.name || '이름 없음';
              return (
                <div key={item.id} className={`storage-item-row ${getExpiryClass(item.urgency, item.dDay)}`}>
                  <span className="item-name-link" onClick={() => navigate(`/product/edit/${item.id}`)}>{finalName}</span>
                  <span className="item-badge-short">{getShortCategory(item.category)}</span>
                  <span className="item-quantity">{item.quantity}g</span>
                  {/* <span className="item-expiry item-expiry-wrapper">{item.expirationdate}<button onClick={(e) => handleDelete(item.id, finalName, e)} className="btn-delete-small">✕</button></span> */}
                  <span className="item-expiry item-expiry-wrapper">{item.expirationDate}<button onClick={(e) => handleDelete(item.id, finalName, e)} className="btn-delete-small">✕</button></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 로그인 되어 있고 + 유통기한 초과 재료가 있을 때만 경고 세션 노출 */}
      {currentUser && expiredItems.length > 0 && (
        <div className="expired-storage-container">
          <h3 className="expired-container-title">
            유통기한 초과 재료 
          </h3>
          <p className="expired-container-sub">
            * 유통기한이 지난 식품들입니다. 냄새와 상태를 확인하시고 사용하거나 ✕ 버튼을 눌러 폐기 처리해 주세요.
          </p>
          
          <div className="expired-items-list">
            {expiredItems.map((item) => {
              const finalName = item.itemName || item.name || '이름 없음';
              return (
                <div key={item.id} className="expired-item-row">
                  <span className="expired-item-name" onClick={() => navigate(`/product/edit/${item.id}`)}>
                    {finalName}
                  </span>
                  <div className="expired-item-right-section">
                    <span className="expired-badge-text">기한 초과됨</span>
                    <span className="expired-item-qty">{item.quantity}g</span>
                    <span className="expired-item-date-wrapper">
                      ({item.expirationDate})
                      <button onClick={(e) => handleDelete(item.id, finalName, e)} className="expired-btn-delete">✕</button>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FridgeMain;