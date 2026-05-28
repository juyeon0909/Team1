import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// 💡 [핵심] 등록 화면과 동일하게 인증 인터셉터가 포함된 axiosInstance를 사용합니다.
import axiosInstance from '../api/axiosInstance';

interface IngredientRow {
  name: string;
  quantity: string;
  showDropdown: boolean; // 드롭다운 노출 여부 독립 관리
  searchResults: Array<{ id?: number; itemId?: number; name?: string; itemName?: string; category?: string }>; // 검색 결과 저장
}

const RecipeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);

  // 상태 변수 정의
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [intro, setIntro] = useState("");

  // 💡 필수 재료 구조를 Register와 완전히 일치시킵니다.
  const [mustIngredients, setMustIngredients] = useState<IngredientRow[]>([
    { name: "", quantity: "", showDropdown: false, searchResults: [] }
  ]);
  const [optIngredients, setOptIngredients] = useState("");
  const [method, setMethod] = useState("");

  const [imagePreview, setImagePreview] = useState<string>("");

  // 개별 행의 드롭다운 영역을 참조하기 위한 useRef 배열
  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([]);

  // 💡 외부 클릭 시 드롭다운 닫기 (Register와 동일)
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

  // 💡 기존 레시피 데이터 불러오기 및 데이터 가공
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ssToken');

        // axios -> axiosInstance로 통일하여 세션 유효화
        const response = await axiosInstance.get(`/api/recipeMain/${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });

        if (response.data) {
          const data = response.data;
          setTitle(data.title || "");

          // 카테고리 역매핑 (영문 DTO -> 국문 UI)
          const reverseCategoryMapper: { [key: string]: string } = {
            "HANSICK": "한식", "WESTERN": "양식", "JAPANESE": "일식", "CHINESE": "중식",
            "SNACK": "간식", "NIGHT_SNACK": "야식", "DIET": "다이어트", "MEAL_PREP": "밀프랩"
          };
          setCategory(reverseCategoryMapper[data.category] || "한식");
          setCookingTime(data.cookingTime ? `${data.cookingTime}분` : "");
          setIntro(data.description || "");
          setMethod(data.steps ? data.steps.join('\n') : "");
          setImagePreview(data.image || "");

          // 💡 필수 재료 세팅 시 확장된 UI 상태 초기값 세팅 (showDropdown: false)
          if (data.mustIngredients && data.mustIngredients.length > 0) {
            setMustIngredients(data.mustIngredients.map((ing: any) => ({
              name: ing.name || "",
              quantity: ing.quantity || "",
              showDropdown: false,
              searchResults: []
            })));
          }
        }
      } catch (error) {
        console.error("레시피 데이터 로드 실패:", error);
        alert("레시피 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipeData();
    }
  }, [id]);

  // 💡 식재료 자동완성 검색 기능 (Debounce + 403 에러 철벽 방어)
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
        const token = localStorage.getItem('ssToken');

        // Register와 똑같이 상대경로 및 ssToken 인증 헤더 탑재
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

  // 💡 항목 선택 핸들러 (itemName과 name 통합 필터링)
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

  const categoryMapper: { [key: string]: string } = {
    "한식": "KOR", "양식": "YANG", "일식": "JAN", "중식": "CHN",
    "간식": "GAN", "야식": "YA", "다이어트": "DIET", "밀프랩": "RAP"
  };

  // 💡 수정사항 저장하기 (PUT 기반 데이터 정제 처리)
  const onSave = async () => {
    if (!title.trim()) return alert("레시피 이름을 입력해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    // DTO 규격에 맞춰 name과 quantity만 쏙 뽑아서 가공
    const filteredMustIngredients = mustIngredients
      .filter(item => item.name.trim() !== "" && item.quantity.trim() !== "")
      .map(item => ({ name: item.name, quantity: item.quantity }));

    if (filteredMustIngredients.length === 0) {
      return alert("필수 재료를 최소 한 개 이상 입력해주세요.");
    }

    const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, "")) || 15;
    const stepsArray = method ? method.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const finalDescription = optIngredients.trim() ? `${intro || title} (선택 재료: ${optIngredients})` : intro || `${title} 레시피입니다.`;

    const recipePayload = {
      id: id,
      title: title,
      dishName: title,
      category: categoryMapper[category] || "KOR",
      cookingTime: numericTime,
      description: finalDescription,
      image: imagePreview || "default.png",
      mustIngredients: filteredMustIngredients,
      steps: stepsArray
    };

    const token = localStorage.getItem('ssToken');

    try {
      setLoading(true);
      // axiosInstance + 상대 경로 매핑을 통해 Security 필터 안전 통과
      const response = await axiosInstance.put(`/api/recipeMain/edit/${id}`, recipePayload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });

      if (response.status === 200 || response.status === 201) {
        alert('레시피 수정이 완료되었습니다!');
        navigate(`/recipeMain`);
      }
    } catch (error: any) {
      console.error("서버 수정 실패:", error);
      if (error.response?.status === 401) {
        alert("로그인 세션이 만료되었거나 로그인 상태가 아닙니다.");
      } else if (error.response?.status === 403) {
        alert("접근 권한이 없거나 차단되었습니다. (인증 인가 에러)");
      } else {
        alert("서버 통신 장애가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 인라인 인풋 UI 디자인 스타일 시트
  const pageContainerStyle = { padding: '28px 40px', background: '#f8f9fa', minHeight: 'calc(100vh - 56px)', fontFamily: 'sans-serif' };
  const backLinkStyle = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer', fontSize: '13px', color: '#666' };
  const cardStyle = { maxWidth: '600px', margin: '0 auto', background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '28px 32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
  const labelStyle = { display: 'block', fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' };
  const subLabelStyle = { fontSize: '11px', color: '#999', marginLeft: '4px' };
  const inputStyle = { width: '100%', padding: '9px 12px', fontSize: '13px', border: '0.5px solid #ccc', borderRadius: '6px', background: '#fafafa', color: '#111', outline: 'none', boxSizing: 'border-box' as const };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>레시피 정보를 불러오는 중입니다...</div>;

  return (
    <div style={pageContainerStyle}>
      <div style={backLinkStyle} onClick={() => navigate(-1)}>
        <span>⬅ 뒤로 가기</span>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#111', marginBottom: '22px' }}>
          레시피 수정
        </div>

        {/* 레시피 이름 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>레시피 이름 *</label>
          <input style={inputStyle} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 두부 계란찜" />
        </div>

        {/* 카테고리 & 조리시간 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>카테고리 *</label>
            <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">선택하세요</option>
              <option>한식</option><option>양식</option><option>일식</option><option>중식</option>
              <option>간식</option><option>야식</option><option>다이어트</option><option>밀프랩</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>조리 시간</label>
            <input style={inputStyle} type="text" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} placeholder="예: 15분" />
          </div>
        </div>

        {/* 간단 소개 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>간단 소개</label>
          <input style={inputStyle} type="text" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="레시피를 한 줄로 소개해주세요" />
        </div>

        {/* 필수 재료 영역 (자동완성 검색 드롭다운 탑재) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>필수 재료 및 용량 *</label>
          {mustIngredients.map((item, index) => (
            <div
              key={index}
              ref={el => { dropdownRefs.current[index] = el; }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '12px', alignItems: 'center', position: 'relative' }}
            >
              {/* 식재료 자동완성 검색 인풋 */}
              <div style={{ position: 'relative' }}>
                <input
                  style={inputStyle}
                  type="text"
                  value={item.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  placeholder="예: 두부"
                  autoComplete="off"
                />

                {/* 💡 FridgeRegister 스타일 규격 100% 매칭 드롭다운 리스트 */}
                {item.showDropdown && item.searchResults && item.searchResults.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px',
                    maxHeight: '180px', overflowY: 'auto', zIndex: 9999, padding: 0, margin: '4px 0 0 0',
                    listStyle: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', textAlign: 'left'
                  }}>
                    {item.searchResults.map((prod, pIdx) => {
                      const displayName = prod.itemName || prod.name || '이름 없음';
                      return (
                        <li
                          key={prod.id || prod.itemId || pIdx}
                          onClick={() => handleSelectItem(index, prod)}
                          style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                          <strong style={{ color: '#333', marginRight: '8px', fontSize: '13px' }}>{displayName}</strong>
                          {prod.category && (
                            <span style={{ color: '#aaa', fontSize: '11px', background: '#eee', padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto' }}>
                              {prod.category}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* 수량/용량 인풋 */}
              <input
                style={inputStyle}
                type="text"
                value={item.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                placeholder="예: 1모, 150g"
              />
              {mustIngredients.length > 1 && (
                <button type="button" onClick={() => removeIngredientRow(index)} style={{ background: '#fff', border: '0.5px solid #ccc', color: '#ff4d4f', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredientRow} style={{ background: 'none', border: '1px dashed #1D9E75', color: '#1D9E75', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%', marginTop: '4px' }}>+ 재료 추가</button>
        </div>

        {/* 선택 재료 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>선택 재료 <span style={subLabelStyle}>쉼표로 구분</span></label>
          <input style={inputStyle} type="text" value={optIngredients} onChange={(e) => setOptIngredients(e.target.value)} placeholder="예: 참기름, 소금" />
        </div>

        {/* 조리 방법 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>조리 방법</label>
          <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} value={method} onChange={(e) => setMethod(e.target.value)} placeholder={`조리 순서를 입력해주세요\n1. 두부를 먹기 좋은 크기로 썰어요\n2. ...`} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '0.5px solid #ccc', background: '#fff', color: '#666' }}>취소</button>
          <button type="button" onClick={onSave} style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', background: '#1D9E75', color: '#fff', border: 'none', fontWeight: '500' }}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};
{/* 커밋 */}
export default RecipeEdit;