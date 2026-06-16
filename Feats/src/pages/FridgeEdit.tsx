import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/FridgeRegister.css';
import type { SearchItem } from '../types/Fridge.ts'; 
import type {User } from '../types/User.ts';
import { notifyError } from '../utils/notifyError';

const FridgeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
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


  useEffect(() => {
  const stored = localStorage.getItem('user');
  if (!stored) {
    alert('로그인 후 이용 가능합니다.');
    navigate('/member/login');
    return;
  }
  
  const user: User = JSON.parse(stored);
}, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (id) {
      axiosInstance.get(`/product/detail/${id}`)
        .then((res) => {
          const item = res.data;
          setItemname(item.itemname || item.name || "");
          setQuantity(item.quantity ? Number(item.quantity) : "");
          setSelectedItemId(item.itemId || null);
          
          if (item.expiry || item.expirationdate) {
            const rawDate = item.expiry || item.expirationdate;
            setExpirationdate(typeof rawDate === 'string' ? rawDate.substring(0, 10) : "");
          }
          if (item.category) setCategory(item.category.trim());

          const rawType = item.type || item.storagetype;
          if (rawType) {
            const dbType = rawType.trim().toUpperCase();
            if (dbType === '실온' || dbType === 'ROOM_TEMP') setStoragetype('ROOM_TEMP');
            else if (dbType === '냉동' || dbType === 'FROZEN') setStoragetype('FROZEN');
            else setStoragetype('REFRIGERATED');
          }
        })
        .catch((err) => notifyError(err, "기존 재료 정보를 불러오지 못했습니다."));
    }
  }, [id]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!itemname.trim() || selectedItemId) {
        if (!itemname.trim()) setSearchResults([]);
        return;
      }
      try {
        const token = localStorage.getItem('ssToken');
        const response = await axiosInstance.get(`/product/search?name=${encodeURIComponent(itemname)}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
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

  const handleSelectItem = (item: SearchItem) => {
    const finalName = item.name || item.itemName || '';
    const finalId = item.id || item.itemId || null;

    setItemname(finalName);
    setSelectedItemId(finalId);
    setShowDropdown(false);

    if (item.category) setCategory(item.category.trim());
    if (item.type) {
      const dbType = item.type.toUpperCase();
      if (dbType === '실온' || dbType === 'ROOM_TEMP') setStoragetype('ROOM_TEMP');
      else if (dbType === '냉동' || dbType === 'FROZEN') setStoragetype('FROZEN');
      else setStoragetype('REFRIGERATED');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemname(e.target.value);
    if (selectedItemId) setSelectedItemId(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedItemId || quantity === '' || !expirationdate) {
      alert('모든 항목을 입력해주세요');
      return;
    }
    if (Number(quantity) > 20000) {
      alert('무게는 20000 이하여야 합니다.');
      return; 
    }
    if (Number(quantity) < 1) {
      alert('무게는 1 이상이어야 합니다.')
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(expirationdate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('이미 유통기한이 지난 날짜는 등록할 수 없습니다.');
      return;
    }

    const stored = localStorage.getItem('user');
    if (!stored) {
      alert('로그인이 필요합니다.');
      navigate('/member/login');
      return;
    }
    const user = JSON.parse(stored);

    let koStorageType = "냉장";
    if (storagetype === "ROOM_TEMP") koStorageType = "실온";
    else if (storagetype === "FROZEN") koStorageType = "냉동";

    try {
      const token = localStorage.getItem('ssToken');
      await axiosInstance.post(`/product/update/${id}`, {
        memberId: user.id,
        id: selectedItemId,        
        itemId: selectedItemId,    
        quantity: Number(quantity),
        expirationdate, 
        expiry: expirationdate,
        storagetype: koStorageType, 
        type: storagetype,
        category
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });

      alert(`${itemname}(이)가 성공적으로 변경되었습니다.`);
      navigate('/product/insert');
    } catch (error) {
      alert('수정 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(error);
    }
  };

  const handleCancel = (): void => {
  navigate('/product/insert'); // 
};

  return (
    <div className="fridge-form-container">
      <div className="fridge-form-card">
        <div className="fridge-form-header-zone">
          <h3 className="fridge-form-title">재료 수정</h3>
          <p className="fridge-form-subtitle">보관 중인 재료의 정보를 수정합니다.</p>
        </div>
        <hr className="fridge-form-divider" />

        <div className="fridge-form-group">
          <label className="fridge-form-label">카테고리</label>
          <select className="fridge-form-input select-pointer" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="과일, 야채류">과일, 야채류</option>
            <option value="육류">육류</option>
            <option value="유지, 당류">유지, 당류</option>
            <option value="곡물류">곡물류</option>
            <option value="유제품류">유제품류</option>
            <option value="수산물류">수산물류</option>
            <option value="콩류">콩류</option>
            <option value="양념류">양념류</option>
            <option value="버섯류">버섯류</option>
          </select>
        </div>

        <div className="fridge-form-group">
          <label className="fridge-form-label">보관 방법</label>
          <select className="fridge-form-input select-pointer" value={storagetype} onChange={(e) => setStoragetype(e.target.value)}>
            <option value="REFRIGERATED">냉장</option>
            <option value="FROZEN">냉동</option>
            <option value="ROOM_TEMP">실온</option>
          </select>
        </div>

        <div className="fridge-form-group" ref={dropdownRef}>
          <label className="fridge-form-label">재료명</label>
          <input type="text" className="fridge-form-input" value={itemname} onChange={handleInputChange} placeholder="예: 우유, 대파" autoComplete="off" />
          {showDropdown && searchResults.length > 0 && (
            <ul className="fridge-search-dropdown-menu"> 
              {searchResults.map((item, index) => {
                const displayName = item.itemName || item.name || '이름 없음';
                const displayId = item.itemId || item.id || index;
                return (
                  <li key={displayId} onClick={() => handleSelectItem(item)} className="fridge-search-dropdown-item">
                    <strong className="dropdown-item-name">{displayName}</strong>
                    <span className="dropdown-item-unit">{item.itemUnit || ''}</span>
                    <span className="dropdown-item-category">{item.category}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="fridge-form-group">
          <label className="fridge-form-label">무게 (g)</label>
          <input type="number" min={1} max={20000} className="fridge-form-input" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="예: 200" />
        </div>

        <div className="fridge-form-group last">
          <label className="fridge-form-label">유통기한</label>
          <input type="date" className="fridge-form-input" value={expirationdate} onChange={(e) => setExpirationdate(e.target.value)} />
        </div>

        <div className="fridge-form-actions">
          <button onClick={handleCancel} className="btn-cancel">취소</button>
          <button onClick={handleSave} className="btn-save">저장</button>
        </div>
      </div>
    </div>
  );
};

export default FridgeEdit;