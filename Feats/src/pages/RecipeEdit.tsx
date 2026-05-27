import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface IngredientRow {
  name: string;
  quantity: string;
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

  // 필수 재료 구조 (기존 단순 name, quantity 구조)
  const [mustIngredients, setMustIngredients] = useState<IngredientRow[]>([
    { name: "", quantity: "" }
  ]);
  const [optIngredients, setOptIngredients] = useState("");
  const [method, setMethod] = useState("");

  const [imagePreview, setImagePreview] = useState<string>("");

  // 💡 기존 레시피 데이터 불러오기
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

        const response = await axios.get(`http://localhost:9000/api/recipeMain/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          withCredentials: true
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

          // 필수 재료 세팅 (불필요한 내장 객체 없이 name과 quantity만 매핑)
          if (data.mustIngredients && data.mustIngredients.length > 0) {
            setMustIngredients(data.mustIngredients.map((ing: any) => ({
              name: ing.name || "",
              quantity: ing.quantity || ""
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

  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...mustIngredients];
    newIngredients[index][field] = value;
    setMustIngredients(newIngredients);
  };

  const addIngredientRow = () => setMustIngredients([...mustIngredients, { name: "", quantity: "" }]);
  const removeIngredientRow = (index: number) => setMustIngredients(mustIngredients.filter((_, i) => i !== index));

  const categoryMapper: { [key: string]: string } = {
    "한식": "KOR", "양식": "YANG", "일식": "JAN", "중식": "CHN",
    "간식": "GAN", "야식": "YA", "다이어트": "DIET", "밀프랩": "RAP"
  };

  // 💡 수정사항 저장하기 (PUT 또는 POST 프로젝트 규격에 맞게 사용)
  const onSave = async () => {
    if (!title.trim()) return alert("레시피 이름을 입력해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    const filteredMustIngredients = mustIngredients
      .filter(item => item.name.trim() !== "" && item.quantity.trim() !== "");

    if (filteredMustIngredients.length === 0) {
      return alert("필수 재료를 최소 한 개 이상 입력해주세요.");
    }

    const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, "")) || 15;
    const stepsArray = method ? method.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const finalDescription = optIngredients.trim() ? `${intro || title} (선택 재료: ${optIngredients})` : intro || `${title} 레시피입니다.`;

    const recipePayload = {
      id: id, // 수정용 ID 포함
      title: title,
      dishName: title,
      category: categoryMapper[category] || "KOR",
      cookingTime: numericTime,
      description: finalDescription,
      image: imagePreview || "default.png",
      mustIngredients: filteredMustIngredients,
      steps: stepsArray
    };

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

    try {
      setLoading(true);
      // 프로젝트 API 명세에 따라 PUT 주소 또는 POST 주소로 전송
      const response = await axios.put(`http://localhost:9000/api/recipeMain/edit/${id}`, recipePayload, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true
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
        alert("접근 권한이 없습니다. (백엔드 시큐리티 차단)");
      } else {
        alert("서버 통신 장애가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

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

        {/* 필수 재료 영역 (순수 Input 폼) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>필수 재료 및 용량 *</label>
          {mustIngredients.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <input
                style={inputStyle}
                type="text"
                value={item.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                placeholder="예: 두부"
              />
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

export default RecipeEdit;