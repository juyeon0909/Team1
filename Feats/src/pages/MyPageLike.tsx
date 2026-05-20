// src/pages/MyPageLike.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { INITIAL_RECIPES, Recipe } from '../types/RecipeData';

const MyPageLike = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const localData = localStorage.getItem('user_recipes');
    if (localData) {
      setRecipes(JSON.parse(localData));
    } else {
      setRecipes(INITIAL_RECIPES);
    }
  }, []);

  const toggleHeart = (id: number) => {
    const updated = recipes.map(r => {
      if (r.id === id) {
        const isHearted = !r.isHearted;
        return { ...r, isHearted, heart: isHearted ? r.heart + 1 : r.heart - 1 };
      }
      return r;
    });
    setRecipes(updated);
    localStorage.setItem('user_recipes', JSON.stringify(updated));
  };

  const heartedRecipes = recipes.filter(r => r.isHearted);

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', padding: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer', fontSize: '13px', color: '#666', marginRight: '12px' }}>⬅️ 뒤로가기</span>
          <h2 style={{ display: 'inline-block', fontSize: '22px', fontWeight: 600, margin: 0, color: '#E05D5D' }}>❤️ 좋아요 한 레시피</h2>
        </div>
        <button onClick={() => navigate('/recipeMain')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>전체 레시피 보기</button>
      </div>

      {heartedRecipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#999', fontSize: '14px', background: '#fff', borderRadius: '8px', border: '0.5px solid #eee' }}>
          🤍 아직 좋아요를 누른 레시피가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {heartedRecipes.map(r => (
            <div key={r.id} style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ height: '120px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px' }}>{r.emoji}</div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>{r.desc}</div>
                <div style={{ paddingTop: '10px', borderTop: '0.5px solid #eee' }}>
                  <span onClick={() => toggleHeart(r.id)} style={{ cursor: 'pointer', color: '#E05D5D', fontSize: '13px', fontWeight: 'bold' }}>
                    ❤️ 좋아요 취소
                  </span>
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