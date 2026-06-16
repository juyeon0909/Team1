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

// 설명(description)에서 "선택재료: ..." 부분을 찾아내는 정규식.
// 괄호 유무, "선택재료"/"선택 재료" 띄어쓰기 유무, ":"/"：" 모두 허용하고
// 그 지점부터 문자열 끝까지를 대상으로 한다.
const OPT_IN_DESC = /[\s(]*선택\s*재료\s*[:：]\s*([\s\S]*?)\)?\s*$/;

const RecipeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

        // 설명에서 "선택재료: ..." 부분을 분리한다.
        //  - 그 앞부분만 순수 소개(intro)로 남기고,
        //  - 거기 적혀 있던 재료들은 선택 재료 입력칸으로 옮긴다(쉼표로 구분).
        const rawDesc = data.description || '';
        const matched = rawDesc.match(OPT_IN_DESC);
        const cleanedIntro = matched ? rawDesc.slice(0, matched.index ?? 0).trim() : rawDesc.trim();
        const extractedOpt = matched
          ? (matched[1] || '').split(',').map(s => s.trim()).filter(Boolean)
          : [];
        setIntro(cleanedIntro);

        // 선택 재료 입력칸: 1순위 DB의 selectIngredients, 없으면 설명에서 추출한 값.
        const fromField = (data.selectIngredients || []).map(ing => ing.name).filter(Boolean);
        setOptIngredients((fromField.length > 0 ? fromField : extractedOpt).join(', '));

        setMethod(data.steps ? data.steps.join('\n') : '');
        setImagePreview(data.image || '');

        if (data.mustIngredients && data.mustIngredients.length > 0) {
          setMustIngredients(data.mustIngredients.map(ing => ({
            name: ing.name || '',
            quantity: String(ing.quantity ?? '').replace(/g$/i, '').trim(),
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

  // 이미지 선택 → base64 변환 → 서버 업로드 → S3 URL 저장
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // 업로드 전 즉시 미리보기 (낙관적)
      setImagePreview(base64);
      try {
        setUploading(true);
        const res = await axiosInstance.post('/recipeMain/upload-image', { image: base64 });
        // 서버가 돌려준 S3 URL로 교체
        setImagePreview(res.data);
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
    if (uploading) return alert('이미지 업로드가 끝난 뒤 저장해 주세요.');

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
    // 선택 재료는 설명(description)에 붙이지 않고, 등록 화면과 동일하게 별도 필드로 전송한다.
    const selectIngredientsList = optIngredients
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(name => ({ name, quantity: 0 }));

    // 혹시라도 소개에 "선택재료: ..."가 남아 있으면 한 번 더 제거해 깨끗한 설명만 저장한다.
    const cleanDescription = (intro || '').replace(OPT_IN_DESC, '').trim();

    const recipePayload = {
      title,
      dishName: title,
      category: KOR_TO_CODE[category] || 'KOR',
      cookingTime: numericTime,
      description: cleanDescription || `${title} 레시피입니다.`,
      image: imagePreview || '',
      mustIngredients: filteredMustIngredients,
      selectIngredients: selectIngredientsList,
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

        {/* 이미지 미리보기 + 업로드 */}
        <div className="form-group">
          <label className="form-label">레시피 사진</label>
          <div
            className="image-upload-box"
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'relative',
              width: '100%',
              height: '220px',
              border: '1px dashed #c7d0d9',
              borderRadius: '8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="레시피 미리보기"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                클릭해서 사진 업로드
              </div>
            )}

            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: '#475569',
              }}>
                업로드 중...
              </div>
            )}

            {imagePreview && !uploading && (
              <div style={{
                position: 'absolute', bottom: '10px', right: '10px',
                background: 'rgba(0,0,0,0.6)', color: '#fff',
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
              }}>
                사진 변경
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

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
