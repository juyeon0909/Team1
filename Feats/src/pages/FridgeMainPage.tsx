import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; 
import '../components/FridgeMain.css';

interface Ingredient {
  id: number;
  itemname: string;
  quantity: number; 
  expirationdate: string;   
  type: 'frozen' | 'refrigerated' | 'room'; 
}

const FridgeMain: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    const fetchStorageItems = async () => {
      try {
        const response = await axiosInstance.get<any[]>('/api/product/list');
        
        const formattedData = response.data.map(item => ({
          id: item.id,
          itemname: item.itemname,
          quantity: item.quantity,
          expirationdate: item.expirationdate,
          type: item.type?.toLowerCase().includes('room') ? 'room' : item.type
        }));
        
        setIngredients(formattedData);
      } catch (error) {
        console.error("냉장고 데이터를 가져오는 중 서버 에러 발생:", error);
      }
    };

    fetchStorageItems();
  }, []);

  const getExpiryClass = (expiryDateStr: string): string => {
    if (!expiryDateStr) return 'expiry-normal';
    const today = new Date('2026-05-22'); 
    const expiry = new Date(expiryDateStr);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return 'expiry-danger';   
    if (diffDays <= 7) return 'expiry-warning';  
    return 'expiry-normal';                      
  };

  const filteredIngredients = ingredients.filter((item) =>
    item.itemname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const frozenItems = filteredIngredients.filter((item) => item.type === 'frozen');
  const refrigeratedItems = filteredIngredients.filter((item) => item.type === 'refrigerated');
  const roomItems = filteredIngredients.filter((item) => item.type === 'room');

  return (
    <div className="storage-page-container">
      
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
          onClick={() => navigate('/product/register')}
        >
          <span className="add-icon-small">＋</span> 재료 등록
        </button>
      </div>
      
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
          <div className="room-header refrigerated-theme">
            <span className="room-emoji">💧</span>
            <h3 className="room-title">냉장 보관실</h3>
            <span className="room-count">{refrigeratedItems.length}</span>
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
          <div className="room-header room-theme">
            <span className="room-emoji">📦</span>
            <h3 className="room-title">상온 보관실</h3>
            <span className="room-count">{roomItems.length}</span>
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