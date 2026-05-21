import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RecipeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
{/* 커밋 체쿠  */}
  // 1. 상태 변수 분리 및 필수재료 배열화
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [intro, setIntro] = useState("");

  // 필수 재료를 객체 배열로 변경
  const [mustIngredients, setMustIngredients] = useState([{ name: "", quantity: "" }]);

  const [optIngredients, setOptIngredients] = useState("");
  const [recipeLink, setRecipeLink] = useState("");
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

  const onSave = () => {
    // 💡 백엔드에 보낼 때는 mustIngredients 배열 전체를 넘겨주시면 됩니다.
    console.log("저장될 필수 재료 데이터: ", mustIngredients);
    alert('레시피 수정 신청이 완료되었습니다. 관리자 승인 후 공개됩니다.');
    navigate('/RecipeMain');
  };

  // 🎨 인라인 스타일 가이드
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
      <div style={backLinkStyle} onClick={() => navigate('/RecipeMain')}>
        <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i>
        <span>{id ? '레시피 상세로' : '레시피 목록으로'}</span>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--color-text-primary, #111)', marginBottom: '22px' }}>
          {id ? `레시피 수정 (ID: ${id})` : '레시피 수정'}
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
              background: 'none', border: '1px dashed #1D9E75', color: '#1D9E75',
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
            수정된 레시피는 관리자 승인 후 공개됩니다.
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
              background: '#1D9E75', color: '#fff', border: 'none', fontWeight: '500'
            }}
          >
            {id ? '저장하기' : '수정 신청'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeEdit;