import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface IngredientRow {
  name: string;
  quantity: string;
}

const RecipeRegister = () => {
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...mustIngredients];
    newIngredients[index][field] = value;
    setMustIngredients(newIngredients);
  };

  const addIngredientRow = () => setMustIngredients([...mustIngredients, { name: "", quantity: "" }]);
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
      .filter(item => item.name.trim() !== "" && item.quantity.trim() !== "");

    if (filteredMustIngredients.length === 0) {
      return alert("필수 재료를 최소 한 개 이상 입력해주세요.");
    }

    const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, "")) || 15;
    const stepsArray = method ? method.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const finalDescription = optIngredients.trim() ? `${intro || title} (선택 재료: ${optIngredients})` : intro || `${title} 레시피입니다.`;

    const recipePayload = {
      title: title,
      dishName: title,
      category: categoryMapper[category] || "KOR",
      cookingTime: numericTime,
      description: finalDescription,
      image: imagePreview || "default.png",
      mustIngredients: filteredMustIngredients,
      steps: stepsArray
    };

    // 로컬 스토리지에서 토큰 꺼내기
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:9000/api/recipeMain/register', recipePayload, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true
      });

      if (response.status === 200 || response.status === 201) {
        alert('레시피 등록 서버 전송 완료!');
        navigate('/recipeMain');
      }
    } catch (error: any) {
      console.error("서버 저장 실패:", error);
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>레시피 정보를 저장 중입니다...</div>;

  return (
    <div style={pageContainerStyle}>
      <div style={backLinkStyle} onClick={() => navigate('/recipeMain')}>
        <span>{id ? '⬅ 레시피 상세로' : '⬅ 레시피 목록으로'}</span>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#111', marginBottom: '22px' }}>
          {id ? `레시피 수정 (ID: ${id})` : '레시피 등록'}
        </div>

        {/* 이미지 업로드 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>요리 대표 이미지</label>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '8px', fontSize: '12px' }} />
          {imagePreview && (
            <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '0.5px solid #eee' }}>
              <img src={imagePreview} alt="대표" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
              <button type="button" onClick={handleRemoveImage} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>✕</button>
            </div>
          )}
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

        {!id && (
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#633806', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span>ℹ️</span>
            등록된 레시피는 승인 후 피드에 노출됩니다.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: '0.5px solid #ccc', background: '#fff', color: '#666' }}>취소</button>
          <button type="button" onClick={onSave} style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', background: '#1D9E75', color: '#fff', border: 'none', fontWeight: '500' }}>
            {id ? '저장하기' : '등록 신청'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeRegister;