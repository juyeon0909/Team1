import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/RecipeRegister.css'; // 💡 분리된 CSS 파일 임포트

interface IngredientRow {
  name: string;
  quantity: string;
  showDropdown: boolean;
  searchResults: Array<{ id?: number; itemId?: number; name?: string; itemName?: string; category?: string }>;
}

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
  padding: '2rem 1rem',
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  marginBottom: '1rem',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '0.95rem',
};

const RecipeRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [intro, setIntro] = useState("");

  const [mustIngredients, setMustIngredients] = useState<IngredientRow[]>([
    { name: "", quantity: "", showDropdown: false, searchResults: [] }
  ]);
  const [optIngredients, setOptIngredients] = useState("");
  const [method, setMethod] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([]);

  // 외부 클릭 시 닫기
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

  // 식재료 검색 (Debounce)
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
        const token = localStorage.getItem('accessToken');

        const response = await axiosInstance.get(`/product/search?name=${encodeURIComponent(value)}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });

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

  // 항목 선택 핸들러
  const handleSelectItem = (index: number, prod: any) => {
    const finalName = prod.itemName || prod.name || '';
    setMustIngredients(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, name: finalName, showDropdown: false, searchResults: [] } : item
      )
    );
  };

  const addIngredientRow = () => setMustIngredients([...mustIngredients, { name: "", quantity: "", showDropdown: false, searchResults: [] }]);
  const removeIngredientRow = (index: number) => setMustIngredients(mustIngredients.filter((_, i) => i !== index));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const categoryMapper: { [key: string]: string } = {
    "한식": "KOR", "양식": "YANG", "일식": "JAN", "중식": "CHN",
    "간식": "GAN", "야식": "YA", "다이어트": "DIET", "밀프랩": "RAP"
  };

  const onSave = async () => {
    if (!title.trim()) return alert("레시피 이름을 입력해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    const filteredMustIngredients = mustIngredients
      .filter(item => item.name.trim() !== "" && item.quantity.trim() !== "")
      .map(item => ({ name: item.name, quantity: item.quantity }));

    if (filteredMustIngredients.length === 0) {
      return alert("필수 재료를 최소 한 개 이상 입력해주세요.");
    }

    try {
      setLoading(true);

      // 1단계: 이미지가 있으면 S3에 먼저 업로드
      let imageUrl = "";
      if (imagePreview) {
        const uploadRes = await axiosInstance.post('/recipeMain/upload-image', {
          image: imagePreview
        });
        imageUrl = uploadRes.data;
      }

      // 2단계: 레시피 데이터 등록
      const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, "")) || 15;
      const stepsArray = method ? method.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const finalDescription = optIngredients.trim()
        ? `${intro || title} (선택 재료: ${optIngredients})`
        : intro || `${title} 레시피입니다.`;

      const token = localStorage.getItem('accessToken');
      const recipePayload = {
        title,
        dishName: title,
        category: categoryMapper[category] || "KOR",
        cookingTime: numericTime,
        description: finalDescription,
        image: imageUrl,
        mustIngredients: filteredMustIngredients,
        steps: stepsArray
      };

      const response = await axiosInstance.post('/recipeMain/register', recipePayload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (response.status === 200 || response.status === 201) {
        alert('레시피 등록 서버 전송 완료!');
        navigate('/recipeMain');
      }
    } catch (error: any) {
      console.error("서버 저장 실패:", error);
      if (error.response?.status === 401) {
        alert("로그인 세션이 만료되었거나 로그인 상태가 아닙니다.");
      } else {
        alert("서버 통신 장애가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="register-loading-box">레시피 정보를 저장 중입니다...</div>;

  return (
    <div style={pageContainerStyle}>
      <div style={backLinkStyle} onClick={() => navigate('/recipeMain')}>
        <span>{id ? ' 레시피 상세로' : ' 레시피 목록으로'}</span>
      </div>

      <div className="register-card">
        <div className="register-card-title">
          {id ? `레시피 수정 (ID: ${id})` : '레시피 등록'}
        </div>

        {/* 이미지 업로드 */}
        <div className="form-group">
          <label className="form-label">요리 대표 이미지</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="file-input-text" />
          {imagePreview && (
            <div className="image-preview-wrapper">
              <img src={imagePreview} alt="대표" className="preview-image" />
              <button type="button" onClick={handleRemoveImage} className="image-delete-btn">✕</button>
            </div>
          )}
        </div>

        {/* 레시피 이름 */}
        <div className="form-group">
          <label className="form-label">레시피 이름 *</label>
          <input className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 두부 계란찜" />
        </div>

        {/* 카테고리 & 조리시간 */}
        <div className="grid-two-columns">
          <div>
            <label className="form-label">카테고리 *</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">선택하세요</option>
              <option>한식</option><option>양식</option><option>일식</option><option>중식</option>
              <option>간식</option><option>야식</option><option>다이어트</option><option>밀프랩</option>
            </select>
          </div>
          <div>
            <label className="form-label">조리 시간 (단위 : 분)</label>
            <input className="form-input" type="text" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} placeholder="숫자만 입력해주세요" />
          </div>
        </div>

        {/* 간단 소개 */}
        <div className="form-group">
          <label className="form-label">간단 소개</label>
          <input className="form-input" type="text" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="레시피를 한 줄로 소개해주세요" />
        </div>

        {/* 필수 재료 및 용량 영역 */}
        <div className="form-group">
          <label className="form-label">필수 재료 및 용량 (g) *</label>
          {mustIngredients.map((item, index) => (
            <div
              key={index}
              ref={el => { dropdownRefs.current[index] = el; }}
              className="ingredient-row"
            >
              <div className="relative-wrapper">
                <input
                  className="form-input"
                  type="text"
                  value={item.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  placeholder="예: 두부"
                  autoComplete="off"
                />

                {item.showDropdown && item.searchResults && item.searchResults.length > 0 && (
                  <ul className="search-dropdown-list">
                    {item.searchResults.map((prod, pIdx) => {
                      const displayName = prod.itemName || prod.name || '이름 없음';
                      return (
                        <li
                          key={prod.id || prod.itemId || pIdx}
                          onClick={() => handleSelectItem(index, prod)}
                          className="dropdown-item"
                        >
                          <strong className="dropdown-item-name">{displayName}</strong>
                          {prod.category && (
                            <span className="dropdown-item-category">
                              {prod.category}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <input
                className="form-input"
                type="text"
                value={item.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                placeholder="숫자만 입력해주세요."
              />
              {mustIngredients.length > 1 && (
                <button type="button" onClick={() => removeIngredientRow(index)} className="row-remove-btn">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredientRow} className="add-row-dashed-btn">+ 재료 추가</button>
        </div>

        {/* 선택 재료 */}
        <div className="form-group">
          <label className="form-label">선택 재료 <span className="form-sublabel">쉼표로 구분</span></label>
          <input className="form-input" type="text" value={optIngredients} onChange={(e) => setOptIngredients(e.target.value)} placeholder="예: 참기름, 소금" />
        </div>

        {/* 조리 방법 */}
        <div className="form-group">
          <label className="form-label">조리 방법</label>
          <textarea className="form-input form-textarea" value={method} onChange={(e) => setMethod(e.target.value)} placeholder={`조리 순서를 입력해주세요\n1. 두부를 먹기 좋은 크기로 썰어요\n2. ...`} />
        </div>

        {!id && (
          <div className="info-banner-box">
            <span>i</span>
            등록된 레시피는 승인 후 등록됩니다.
          </div>
        )}

        <div className="action-button-group">
          <button type="button" onClick={() => navigate(-1)} className="cancel-action-btn">취소</button>
          <button type="button" onClick={onSave} className="submit-action-btn">
            {id ? '저장하기' : '등록 신청'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeRegister;