import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const RecipeRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 💡 누락된 로딩 상태 추가
  const [loading, setLoading] = useState<boolean>(false);

  // 상태 변수 정의
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [intro, setIntro] = useState("");
  const [mustIngredients, setMustIngredients] = useState([{ name: "", quantity: "" }]);
  const [optIngredients, setOptIngredients] = useState(""); // UI 연동용
  const [method, setMethod] = useState("");

  // 💡 누락된 이미지 관련 상태 정의 복구
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // 필수 재료 관련 핸들러들
  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...mustIngredients];
    newIngredients[index][field] = value;
    setMustIngredients(newIngredients);
  };

  const addIngredientRow = () => setMustIngredients([...mustIngredients, { name: "", quantity: "" }]);
  const removeIngredientRow = (index: number) => setMustIngredients(mustIngredients.filter((_, i) => i !== index));

  // 💡 누락된 이미지 핸들러 함수 정의 복구
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

  // 💡 화면의 한국어 카테고리를 백엔드 Enum 문자열로 치환하기 위한 매퍼 정의
  const categoryMapper: { [key: string]: string } = {
    "한식": "HANSICK", "양식": "WESTERN", "일식": "JAPANESE", "중식": "CHINESE",
    "간식": "SNACK", "야식": "NIGHT_SNACK", "다이어트": "DIET", "밀프랩": "MEAL_PREP"
  };

  // 백엔드 전송 핵심 핸들러
  const onSave = async () => {
    if (!title.trim()) return alert("레시피 이름을 입력해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    const filteredMustIngredients = mustIngredients.filter(
      item => item.name.trim() !== "" && item.quantity.trim() !== ""
    );
    if (filteredMustIngredients.length === 0) {
      return alert("필수 재료를 최소 한 개 이상 입력해주세요.");
    }

    const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, "")) || 15;
    const stepsArray = method ? method.split('\n').map(s => s.trim()).filter(Boolean) : [];

    // 선택 재료가 있다면 간단 소개(description) 란에 함께 보기 좋게 포맷팅하여 전달
    String;
    const finalDescription = optIngredients.trim()
      ? `${intro || title} (선택 재료: ${optIngredients})`
      : intro || `${title} 레시피입니다.`;

    const recipePayload = {
      title: title,
      dishName: title,
      category: categoryMapper[category] || "HANSICK", // 💡 선택한 한글 카테고리를 Enum 규격에 맞춰 매핑
      cookingTime: numericTime,
      description: finalDescription,
      image: imagePreview || "default.png",
      mustIngredients: filteredMustIngredients,
      steps: stepsArray
    };

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:9000/api/recipeMain/register', recipePayload, {
        withCredentials: true
      });

      if (response.status === 200 || response.status === 201) {
        alert('레시피 등록 서버 전송 완료!');
        navigate('/recipeMain');
      }
    } catch (error: any) {
      console.error("서버 저장 실패:", error);
      alert(error.response?.status === 401 ? "세션이 안 통합니다. 로그인 상태를 체크하세요." : "서버 통신 장애가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 인라인 스타일 가이드 객체
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
        <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i>
        <span>{id ? '레시피 상세로' : '레시피 목록으로'}</span>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#111', marginBottom: '22px' }}>
          {id ? `레시피 등록 (ID: ${id})` : '레시피 등록'}
        </div>

        {/* 이미지 업로드 영역 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>요리 대표 이미지</label>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '8px', fontSize: '12px' }} />
          {imagePreview ? (
            <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '0.5px solid #eee' }}>
              <img src={imagePreview} alt="대표 이미지" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
              <button type="button" onClick={handleRemoveImage} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          ) : (
            <div style={{ padding: '20px', background: '#fafafa', border: '1px dashed #ccc', borderRadius: '6px', textAlign: 'center', color: '#999', fontSize: '12px' }}>권장 비율 정방형 또는 4:3 (선택사항)</div>
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

        {/* 필수 재료 배열 루프 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>필수 재료 및 용량 *</label>
          {mustIngredients.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input style={inputStyle} type="text" value={item.name} onChange={(e) => handleIngredientChange(index, 'name', e.target.value)} placeholder="예: 두부" />
              <input style={inputStyle} type="text" value={item.quantity} onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)} placeholder="예: 150g, 1개" />
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

        {/* 안내 문구 배너 */}
        {!id && (
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#633806', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '14px' }}>ℹ️</span>
            등록된 레시피는 관리자 승인 후 공개됩니다.
          </div>
        )}

        {/* 💡 닫는 태그 구조가 깨져있던 하단 버튼 제어 영역 교정 완료 */}
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