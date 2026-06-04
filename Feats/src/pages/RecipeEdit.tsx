import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import type { RecipeDto } from '../types/Recipe';
import '../components/RecipeEdit.css';

interface IngredientRow {
  name: string;
  quantity: string;
  showDropdown: boolean;
  searchResults: Array<{ id?: number; itemId?: number; name?: string; itemName?: string; category?: string }>;
}

// 카테고리 코드 ↔ 한글 (편집 폼은 코드값을 다뤄야 하므로 여기서 직접 관리)
const CODE_TO_KOR: Record<string, string> = {
  KOR: '한식', YANG: '양식', JAN: '일식', CHN: '중식',
  GAN: '간식', YA: '야식', DIET: '다이어트', RAP: '밀프랩',
};
const KOR_TO_CODE: Record<string, string> = {
  한식: 'KOR', 양식: 'YANG', 일식: 'JAN', 중식: 'CHN',
  간식: 'GAN', 야식: 'YA', 다이어트: 'DIET', 밀프랩: 'RAP',
};

const RecipeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [intro, setIntro] = useState('');

  const [mustIngredients, setMustIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '', showDropdown: false, searchResults: [] }
  ]);
  const [optIngredients, setOptIngredients] = useState('');
  const [method, setMethod] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');

  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      dropdownRefs.current.forEach((ref, idx) => {
        if (ref && !ref.contains(event.target as Node)) {
          setMustIngredients(prev =>
            prev.map((item, i) => i === idx ? { ...item, showDropdown: false } : item)
          );
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 기존 레시피 데이터 단건 조회 (원본 RecipeDto 사용 — 카테고리 코드/원본 수량 필요)
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<RecipeDto>(`/recipeMain/${id}`);
        const data = res.data;

        setTitle(data.title || '');
        setCategory(CODE_TO_KOR[data.category] || '한식');
        setCookingTime(data.cookingTime ? `${data.cookingTime}분` : '');
        setIntro(data.description || '');
        setMethod(data.steps ? data.steps.join('\n') : '');
        setImagePreview(data.image || '');

        if (data.mustIngredients && data.mustIngredients.length > 0) {
          setMustIngredients(data.mustIngredients.map(ing => ({
            name: ing.name || '',
            quantity: String(ing.quantity ?? ''),
            showDropdown: false,
            searchResults: []
          })));
        }
      } catch (error) {
        console.error('레시피 데이터 로드 실패:', error);
        alert('레시피 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecipeData();
  }, [id]);

  // 식재료 자동완성 검색 (Debounce)
  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...mustIngredients];
    newIngredients[index][field] = value;

    if (field === 'quantity') {
      setMustIngredients(newIngredients);
      return;
    }

    if (!value.trim()) {
      newIngredients[index].showDropdown = false;
      newIngredients[index].searchResults = [];
      setMustIngredients(newIngredients);
      return;
    }

    setMustIngredients(newIngredients);

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await axiosInstance.get(`/product/search?name=${encodeURIComponent(value)}`);
        setMustIngredients(prev =>
          prev.map((item, i) =>
            i === index ? { ...item, searchResults: response.data, showDropdown: response.data.length > 0 } : item
          )
        );
      } catch (error) {
        console.error('식재료 검색 실패:', error);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  };

  const handleSelectItem = (index: number, prod: any) => {
    const finalName = prod.itemName || prod.name || '';
    setMustIngredients(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, name: finalName, showDropdown: false, searchResults: [] } : item
      )
    );
  };

  const addIngredientRow = () =>
    setMustIngredients([...mustIngredients, { name: '', quantity: '', showDropdown: false, searchResults: [] }]);
  const removeIngredientRow = (index: number) =>
    setMustIngredients(mustIngredients.filter((_, i) => i !== index));

  // 수정 저장
  const onSave = async () => {
    if (!title.trim()) return alert('레시피 이름을 입력해주세요.');
    if (!category) return alert('카테고리를 선택해주세요.');

    // 수량은 숫자만 추출해서 전송 (백엔드 Integer)
    const filteredMustIngredients = mustIngredients
      .filter(item => item.name.trim() !== '' && String(item.quantity).trim() !== '')
      .map(item => ({
        name: item.name.trim(),
        quantity: parseInt(String(item.quantity).replace(/[^0-9]/g, ''), 10) || 0,
      }));

    if (filteredMustIngredients.length === 0) {
      return alert('필수 재료를 최소 한 개 이상 입력해주세요.');
    }

    const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, ''), 10) || 15;
    const stepsArray = method ? method.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const finalDescription = optIngredients.trim()
      ? `${intro || title} (선택 재료: ${optIngredients})`
      : intro || `${title} 레시피입니다.`;

    const recipePayload = {
      title,
      dishName: title,
      category: KOR_TO_CODE[category] || 'KOR',
      cookingTime: numericTime,
      description: finalDescription,
      image: imagePreview || '',
      mustIngredients: filteredMustIngredients,
      steps: stepsArray,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post(`/recipeMain/edit/${id}`, recipePayload);
      if (response.status === 200 || response.status === 201) {
        alert('레시피 수정이 완료되었습니다! (재승인 후 노출됩니다)');
        navigate('/recipeMain');
      }
    } catch (error: any) {
      console.error('서버 수정 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인 세션이 만료되었거나 로그인 상태가 아닙니다.');
      } else if (error.response?.status === 403) {
        alert('접근 권한이 없거나 차단되었습니다.');
      } else {
        alert(error.response?.data || '서버 통신 장애가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="edit-loading-box">레시피 정보를 불러오는 중입니다...</div>;

  return (
    <div className="recipe-edit-container">
      <div className="back-link" onClick={() => navigate(-1)}>
        <span>⬅ 뒤로 가기</span>
      </div>

      <div className="edit-card">
        <div className="edit-card-title">레시피 수정</div>

        <div className="form-group">
          <label className="form-label">레시피 이름 *</label>
          <input className="form-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 두부 계란찜" />
        </div>

        <div className="grid-two-columns">
          <div>
            <label className="form-label">카테고리 *</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">선택하세요</option>
              <option>한식</option><option>양식</option><option>일식</option><option>중식</option>
              <option>간식</option><option>야식</option><option>다이어트</option><option>밀프랩</option>
            </select>
          </div>
          <div>
            <label className="form-label">조리 시간</label>
            <input className="form-input" type="text" value={cookingTime} onChange={e => setCookingTime(e.target.value)} placeholder="예: 15분" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">간단 소개</label>
          <input className="form-input" type="text" value={intro} onChange={e => setIntro(e.target.value)} placeholder="레시피를 한 줄로 소개해주세요" />
        </div>

        <div className="form-group">
          <label className="form-label">필수 재료 및 용량 *</label>
          {mustIngredients.map((item, index) => (
            <div key={index} ref={el => { dropdownRefs.current[index] = el; }} className="ingredient-row">
              <div className="relative-wrapper">
                <input
                  className="form-input"
                  type="text"
                  value={item.name}
                  onChange={e => handleIngredientChange(index, 'name', e.target.value)}
                  placeholder="예: 두부"
                  autoComplete="off"
                />
                {item.showDropdown && item.searchResults && item.searchResults.length > 0 && (
                  <ul className="search-dropdown-list">
                    {item.searchResults.map((prod, pIdx) => {
                      const displayName = prod.itemName || prod.name || '이름 없음';
                      return (
                        <li key={prod.id || prod.itemId || pIdx} onClick={() => handleSelectItem(index, prod)} className="dropdown-item">
                          <strong className="dropdown-item-name">{displayName}</strong>
                          {prod.category && <span className="dropdown-item-category">{prod.category}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <input
                className="form-input"
                type="number"
                value={item.quantity}
                onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
                placeholder="숫자만 (예: 150)"
              />
              {mustIngredients.length > 1 && (
                <button type="button" onClick={() => removeIngredientRow(index)} className="row-remove-btn">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredientRow} className="add-row-dashed-btn">+ 재료 추가</button>
        </div>

        <div className="form-group">
          <label className="form-label">선택 재료 <span className="form-sublabel">쉼표로 구분</span></label>
          <input className="form-input" type="text" value={optIngredients} onChange={e => setOptIngredients(e.target.value)} placeholder="예: 참기름, 소금" />
        </div>

        <div className="form-group">
          <label className="form-label">조리 방법</label>
          <textarea className="form-input form-textarea" value={method} onChange={e => setMethod(e.target.value)} placeholder={`조리 순서를 입력해주세요\n1. 두부를 먹기 좋은 크기로 썰어요\n2. ...`} />
        </div>

        <div className="action-button-group">
          <button type="button" onClick={() => navigate(-1)} className="cancel-action-btn">취소</button>
          <button type="button" onClick={onSave} className="submit-action-btn">저장하기</button>
        </div>
      </div>
    </div>
  );
};

export default RecipeEdit;
