import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 레시피 타입 정의
interface Recipe {
  id: string;
  name: string;
  cat: string;
  time: number;
  desc: string;
  tags: string[];
  image?: string;
}

const MyPageRecipe = () => {
  const navigate = useNavigate();
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);

  // 컴포넌트 마운트 시 LocalStorage에서 데이터를 로드
  useEffect(() => {
    const saved = localStorage.getItem('my_recipes');
    if (saved) {
      setMyRecipes(JSON.parse(saved));
    }
  }, []);

  // 레시피 삭제 핸들러
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 시 상세 페이지로 이동하는 이벤트 전파 방지
    if (!window.confirm("정말 이 레시피를 삭제하시겠습니까?")) return;

    const filtered = myRecipes.filter(recipe => recipe.id !== id);
    setMyRecipes(filtered);
    localStorage.setItem('my_recipes', JSON.stringify(filtered));
  };

  // 인라인 스타일 가이드 (기존 톤앤매너 유지)
  const containerStyle = {
    padding: '28px 40px',
    background: '#f8f9fa',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans, sans-serif)'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  };

  const cardStyle = {
    background: '#fff',
    border: '0.5px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    cursor: 'pointer',
    position: 'relative' as const
  };

  return (
    <div style={containerStyle}>
      {/* 상단 상단 네비게이션 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate('/recipeMain')} // 소문자 경로 통일
        >
          <i className="ti ti-arrow-left" style={{ fontSize: '16px' }}></i>
          <span style={{ fontSize: '13px', color: '#666' }}>메인으로</span>
        </div>
        <button
          onClick={() => navigate('/recipeMain/register')} // 소문자 등록 페이지 경로 통일
          style={{
            padding: '8px 16px',
            background: '#1D9E75',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          + 새 레시피 등록
        </button>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: '500', marginTop: '24px', color: '#111' }}>
        내가 등록한 레시피
      </h2>

      {myRecipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#999', fontSize: '13px' }}>
          아직 등록한 레시피가 없습니다. 나만의 비법 레시피를 등록해보세요!
        </div>
      ) : (
        <div style={gridStyle}>
          {myRecipes.map((recipe) => (
            <div
              key={recipe.id}
              style={cardStyle}
              onClick={() => navigate(`/recipeMain/${recipe.id}`)} // 상세페이지 연결
            >
              {/* 이미지 영역 */}
              <div style={{ width: '100%', height: '140px', background: '#fafafa', borderBottom: '0.5px solid #f5f5f5' }}>
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '24px' }}>🍳</div>
                )}
              </div>

              {/* 텍스트 컨텐츠 영역 */}
              <div style={{ padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#1D9E75', fontWeight: 'bold' }}>{recipe.cat}</span>
                <h3 style={{ fontSize: '14px', margin: '4px 0 6px 0', color: '#111', fontWeight: '500' }}>{recipe.name}</h3>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {recipe.desc}
                </p>

                {/* 태그 리스트 */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {recipe.tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '10px', background: '#f1f3f5', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 카드 우상단 삭제(X) 버튼 */}
              <button
                onClick={(e) => handleDelete(recipe.id, e)}
                style={{
                  position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)',
                  border: '0.5px solid #eee', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', color: '#ff4d4f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
{/* 커밋 체크 */}{/* 커밋 */}
export default MyPageRecipe;