import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/FridgeRegister.css';

interface SearchItem {
  id?: number;
  itemId?: number;
  name?: string;
  itemName?: string;
  category: string;     
  type?: string;        
  itemUnit?: string;
}

const FridgeRegister: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [itemname, setItemname] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [quantity, setQuantity] = useState<number | ''>('');
  const [expirationdate, setExpirationdate] = useState('');

  const [storagetype, setStoragetype] = useState('REFRIGERATED');
  const [category, setCategory] = useState('과일, 야채류'); 

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 식재료 자동완성 검색 (Debounce)
  useEffect(() => {
    const fetchItems = async () => {
      if (!itemname.trim() || selectedItemId) {
        if (!itemname.trim()) setSearchResults([]);
        return;
      }
      try {
        const token = localStorage.getItem('ssToken');
        const response = await axiosInstance.get(`/product/search?name=${encodeURIComponent(itemname)}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });

        setSearchResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error('식재료 검색 실패:', error);
      }
    };

    const delayDebounce = setTimeout(fetchItems, 200);
    return () => clearTimeout(delayDebounce);
  }, [itemname, selectedItemId]);

  // 드롭다운 항목 선택 핸들러
  const handleSelectItem = (item: SearchItem) => {
    const finalName = item.name || item.itemName || '';
    const finalId = item.id || item.itemId || null;

    setItemname(finalName);
    setSelectedItemId(finalId);
    setShowDropdown(false);

    if (item.category) {
      setCategory(item.category.trim());
    }
    if (item.type) {
      const dbType = item.type.toUpperCase();

      if (dbType === '실온' || dbType === 'ROOM_TEMP') {
        setStoragetype('ROOM_TEMP');
      } else if (dbType === '냉동' || dbType === 'FROZEN') {
        setStoragetype('FROZEN');       
      } else if (dbType === '냉장' || dbType === 'REFRIGERATED') {
        setStoragetype('REFRIGERATED'); 
      } else {
        setStoragetype('REFRIGERATED'); 
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemname(e.target.value);
    if (selectedItemId) {
      setSelectedItemId(null);
    }
  };

  // 새 식재료 등록 처리
  const handleSave = async (): Promise<void> => {
    if (!selectedItemId || quantity === '' || !expirationdate) {
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
        itemId: selectedItemId,
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

        <div className="fridge-form-group">
          <label className="fridge-form-label">카테고리</label>
          <select
            className="fridge-form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="과일, 야채류">과일, 야채류</option>
            <option value="육류">육류</option>
            <option value="유지, 당류">유지, 당류</option>
            <option value="곡물류">곡물류</option>
            <option value="유제품류">유제품류</option>
            <option value="수산물류">수산물류</option>
            <option value="콩류">콩류</option>
            <option value="양념류">양념류</option>
            <option value="버섯류">버섯류</option>
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

        <div className="fridge-form-group" style={{ position: 'relative' }} ref={dropdownRef}>
          <label className="fridge-form-label">재료명</label>
          <input
            type="text"
            className="fridge-form-input"
            value={itemname}
            onChange={handleInputChange}
            placeholder="예: 우유, 대파"
            autoComplete="off"
          />

          {showDropdown && searchResults.length > 0 && (
            <ul style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px',
              maxHeight: '180px', overflowY: 'auto', zIndex: 9999, padding: 0, margin: '4px 0 0 0',
              listStyle: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}>
              {searchResults.map((item, index) => {
                const displayName = item.itemName || item.name || '이름 없음';
                const displayId = item.itemId || item.id || index;
                return (
                  <li
                    key={displayId}
                    onClick={() => handleSelectItem(item)}
                    style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    <strong style={{ color: '#333', marginRight: '8px' }}>{displayName}</strong>
                    <span style={{ color: '#888', fontSize: '13px', flexGrow: 1 }}>{item.itemUnit || '개'}</span>
                    <span style={{ color: '#aaa', fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '10px' }}>{item.category}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

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