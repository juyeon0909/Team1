import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RecipeRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 상태 변수 관리
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [intro, setIntro] = useState("");

  // 필수 재료 (객체 배열)
  const [mustIngredients, setMustIngredients] = useState([{ name: "", quantity: "" }]);
  const [optIngredients, setOptIngredients] = useState("");
  const [method, setMethod] = useState("");

  // 필수 재료 관련 핸들러들
  const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...mustIngredients];
    newIngredients[index][field] = value;
    setMustIngredients(newIngredients);
  };

  const addIngredientRow = () => {
    setMustIngredients([...mustIngredients, { name: "", quantity: "" }]);
  };

  const removeIngredientRow = (index: number) => {
    if (mustIngredients.length === 1) return;
    setMustIngredients(mustIngredients.filter((_, i) => i !== index));
  };

  // 이미지 상태 관리
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

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

  // ================= [수정 및 연동 추가된 부분] =================
  const onSave = () => {
    // 필수 항목 유효성 검사
    if (!title.trim()) return alert("레시피 이름을 입력해주세요.");
    if (!category) return alert("카테고리를 선택해주세요.");

    // 1. 필수 재료 데이터 필터링 (비어있는 행 제외)
    const filteredMustIngredients = mustIngredients.filter(
      item => item.name.trim() !== "" && item.quantity.trim() !== ""
    );
    if (filteredMustIngredients.length === 0) {
      return alert("필수 재료를 최소 한 개 이상 입력해주세요.");
    }

    // 2. 조리 시간에서 숫자만 추출 (메인 화면은 time: number 구조)
    const numericTime = parseInt(cookingTime.replace(/[^0-9]/g, "")) || 15;

    // 3. 선택 재료 가공: 쉼표 분리 문자열 ➔ 배열 변환
    const selectIngredientsArray = optIngredients
      ? optIngredients.split(',').map(item => item.trim()).filter(Boolean)
      : [];

    // 4. 조리 방법 가공: 엔터(\n) 단위 분리 줄글 ➔ 배열 변환
    const stepsArray = method
      ? method.split('\n').map(step => step.trim()).filter(Boolean)
      : ['조리 방법이 등록되지 않았습니다.'];

    // 5. 메인 규격 및 지속 저장을 위한 데이터 객체 조립 (id와 image 추가)
    const newRecipeData = {
      id: Date.now().toString(), // 고유 ID (상세보기 및 삭제용)
      name: title,
      cat: category,
      time: numericTime,
      desc: intro || `${title} 레시피입니다.`,
      tags: [category, `${numericTime}분`], // 카테고리와 시간을 기본 태그로 활용
      urgent: false,
      mustIngredients: filteredMustIngredients,
      selectIngredients: selectIngredientsArray,
      missingIngredients: [], // 초기값 빈 배열
      steps: stepsArray,
      emoji: '🍳', // 임시 기본 이모지
      bg: '#E1F5EE', // 임시 기본 배경색
      image: imagePreview || null // 이미지 Base64 스트링 저장
    };

    try {
      // localStorage에서 기존 'my_recipes' 데이터를 읽어옴 (없으면 빈 배열)
      const existingRecipes = JSON.parse(localStorage.getItem('my_recipes') || '[]');

      // 최신 등록 순으로 앞에 누적
      const updatedRecipes = [newRecipeData, ...existingRecipes];

      // localStorage에 다시 JSON 형태로 저장
      localStorage.setItem('my_recipes', JSON.stringify(updatedRecipes));

      alert('레시피 등록이 완료되었습니다.');

      // 등록이 끝나면 모아보기 페이지로 이동시킵니다.
      navigate('/mypage/recipe');
    } catch (error) {
      console.error("Storage error:", error);
      alert("이미지 용량이 너무 커서 저장에 실패했습니다. 다른 이미지를 사용하거나 이미지를 제외해주세요.");
    }
  };
  // =========================================================

  // 인라인 스타일 가이드
  const pageContainerStyle = {
    padding: '28px 40px',
    background: 'var(--color-background-tertiary, #f8f9fa)',
    minHeight: 'calc(100vh - 56px)',
    fontFamily: 'var(--font-sans, sans-serif)',
  };

  const backLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--color-text-secondary, #666)',
  };

  const cardStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid var(--color-border-tertiary, #eee)',
    borderRadius: 'var(--border-radius-lg, 8px)',
    padding: '28px 32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: 'var(--color-text-secondary, #555)',
    marginBottom: '5px',
    fontWeight: '500',
  };

  const subLabelStyle = {
    fontSize: '11px',
    color: 'var(--color-text-tertiary, #999)',
    marginLeft: '4px',
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    border: '0.5px solid var(--color-border-secondary, #ccc)',
    borderRadius: 'var(--border-radius-md, 6px)',
    background: 'var(--color-background-secondary, #fafafa)',
    color: 'var(--color-text-primary, #111)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={pageContainerStyle}>
      <div style={backLinkStyle} onClick={() => navigate('/recipeMain')}>
        <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i>
        <span>{id ? '레시피 상세로' : '레시피 목록으로'}</span>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--color-text-primary, #111)', marginBottom: '22px' }}>
          {id ? `레시피 등록 (ID: ${id})` : '레시피 등록'}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>요리 대표 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: '8px', fontSize: '12px' }}
          />
          {imagePreview ? (
            <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '0.5px solid #eee' }}>
              <img src={imagePreview} alt="대표 이미지" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff',
                  border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '11px'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div style={{ padding: '20px', background: '#fafafa', border: '1px dashed #ccc', borderRadius: '6px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              권장 비율 정방형 또는 4:3 (선택사항)
            </div>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>레시피 이름 *</label>
          <input
            style={inputStyle}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 두부 계란찜"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>카테고리 *</label>
            <select
              style={inputStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">선택하세요</option>
              <option>한식</option><option>양식</option><option>일식</option>
              <option>중식</option><option>간식</option><option>야식</option>
              <option>다이어트</option><option>밀프랩</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>조리 시간</label>
            <input
              style={inputStyle}
              type="text"
              value={cookingTime}
              onChange={(e) => setCookingTime(e.target.value)}
              placeholder="예: 15분"
            />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>간단 소개</label>
          <input
            style={inputStyle}
            type="text"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="레시피를 한 줄로 소개해주세요"
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>필수 재료 및 용량 *</label>
          {mustIngredients.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
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
                placeholder="예: 150g, 1개"
              />
              {mustIngredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  style={{
                    background: '#fff', border: '0.5px solid #ccc', color: '#ff4d4f',
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addIngredientRow}
            style={{
              background: 'none', border: '1px dashed #6FBC44', color: '#6FBC44',
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', width: '100%', marginTop: '4px'
            }}
          >
            + 재료 추가
          </button>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>
            선택 재료 <span style={subLabelStyle}>쉼표로 구분</span>
          </label>
          <input
            style={inputStyle}
            type="text"
            value={optIngredients}
            onChange={(e) => setOptIngredients(e.target.value)}
            placeholder="예: 참기름, 소금"
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>조리 방법</label>
          <textarea
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder={`조리 순서를 입력해주세요\n1. 두부를 먹기 좋은 크기로 썰어요\n2. ...`}
          />
        </div>

        {!id && (
          <div style={{
            background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 'var(--border-radius-md, 6px)',
            padding: '10px 14px', fontSize: '12px', color: '#633806', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start'
          }}>
            <i className="ti ti-info-circle" style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}></i>
            등록된 레시피는 승인 후 공개 됩니다.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 18px', fontSize: '13px', borderRadius: 'var(--border-radius-md, 6px)', cursor: 'pointer',
              border: '0.5px solid var(--color-border-secondary, #ccc)', background: 'var(--color-background-primary, #fff)', color: 'var(--color-text-secondary, #666)'
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              padding: '8px 18px', fontSize: '13px', borderRadius: 'var(--border-radius-md, 6px)', cursor: 'pointer',
              background: '#6FBC44', color: '#fff', border: 'none', fontWeight: '500'
            }}
          >
            {id ? '저장하기' : '등록 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};
{/*커밋 체크*/}
export default RecipeRegister;