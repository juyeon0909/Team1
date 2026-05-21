import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 💡 [핵심 싱크] 메인(RecipeMain) 페이지의 데이터 확장 구조와 완벽 일치시킵니다.
interface Recipe {
  id: number;
  name: string;
  cat: string;
  time: number;
  match: number;
  emoji: string;
  bg: string;
  desc: string;
  tags: string[];
  heart: number;
  star: number;
  urgent: boolean;
  isHearted?: boolean;
  isScrapped?: boolean;
  mustIngredients: { name: string; quantity: string }[];
  selectIngredients: string[];
  missingIngredients: string[];
  steps: string[];
}

const MyPageLike = () => {
  const navigate = useNavigate();
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);

  // 1. 화면 진입 시 로컬스토리지에서 최신 레시피 상태 로드
  useEffect(() => {
    const localData = localStorage.getItem('user_recipes');
    if (localData) {
      const allRecipes: Recipe[] = JSON.parse(localData);
      setLikedRecipes(allRecipes.filter(r => r.isHearted === true));
    }
  }, []);

  // 2. 좋아요 페이지 내에서 즉시 하트 취소하기
  const handleRemoveLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 💡 카드 클릭 이벤트가 부모(상세보기 이동)로 전파되는 것 방지

    const localData = localStorage.getItem('user_recipes');
    if (!localData) return;

    const allRecipes: Recipe[] = JSON.parse(localData);
    const updatedRecipes = allRecipes.map(r => {
      if (r.id === id) {
        return {
          ...r,
          isHearted: false,
          heart: Math.max(0, r.heart - 1)
        };
      }
      return r;
    });

    // 로컬스토리지에 원본 저장 (메인 페이지와 동기화)
    localStorage.setItem('user_recipes', JSON.stringify(updatedRecipes));
    // 현재 화면 리스트 즉시 갱신 (하트 풀린 아이템 제외)
    setLikedRecipes(updatedRecipes.filter(r => r.isHearted === true));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', padding: '28px 40px', color: '#111' }}>

      {/* 타이틀 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/recipeMain')} // 메인으로 타겟팅 이동
          style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0, outline: 'none' }}
        >
          ⬅️
        </button>
        <div style={{ fontSize: '20px', fontWeight: 500 }}>❤️ 좋아요 한 레시피 ({likedRecipes.length})</div>
      </div>

      {/* 텅 비어있을 때 */}
      {likedRecipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: '8px', border: '0.5px solid #eee' }}>
          <span style={{ fontSize: '48px' }}>🤍</span>
          <div style={{ marginTop: '16px', fontSize: '15px', color: '#666' }}>아직 좋아요 한 레시피가 없습니다.</div>
          <button
            onClick={() => navigate('/recipeMain')}
            style={{ marginTop: '16px', background: '#1D9E75', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            레시피 구경하러 가기
          </button>
        </div>
      ) : (
        /* 좋아요 카드 리스트 그리드 */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {likedRecipes.map(r => (
            <div
              key={r.id}
              onClick={() => {
                // 💡 [정상 연동 확인] 메인('/recipeMain')으로 state를 들고 돌아가 즉시 상세창을 띄우게 만듭니다.
                navigate('/recipeMain', { state: { selectedId: r.id } });
              }}
              style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            >
              <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                {r.emoji}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '6px' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5, marginBottom: '10px' }}>{r.desc}</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#999', alignItems: 'center' }}>
                    <span>⏱️ {r.time}분</span>
                    <span>⭐ {r.star}</span>
                  </div>

                  {/* 하트 버튼 토글 */}
                  <button
                    onClick={(e) => handleRemoveLike(r.id, e)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#E05D5D', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', outline: 'none' }}
                    title="좋아요 취소"
                  >
                    ❤️ {r.heart}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPageLike;