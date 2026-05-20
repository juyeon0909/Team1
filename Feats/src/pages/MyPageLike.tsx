// src/pages/RecipeLikes.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_RECIPES } from '../types/RecipeData';
import type { Recipe } from '../types/RecipeData';

const MyPageLike = () => {
  const navigate = useNavigate();
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);

  // 1. 화면이 켜질 때 로컬스토리지에서 데이터를 읽어와 '좋아요'한 것만 걸러냅니다.
  useEffect(() => {
    const localData = localStorage.getItem('user_recipes');
    const allRecipes: Recipe[] = localData ? JSON.parse(localData) : INITIAL_RECIPES;

    // 하트(isHearted)가 true인 레시피만 골라내기
    const onlyLikes = allRecipes.filter(r => r.isHearted === true);
    setLikedRecipes(onlyLikes);
  }, []);

  // 2. 이 페이지에서도 하트를 눌러 좋아요를 바로 취소할 수 있게 만드는 함수
  const handleRemoveLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    // 로컬스토리지 전체 데이터를 가져와서 해당 아이템만 수정
    const localData = localStorage.getItem('user_recipes');
    const allRecipes: Recipe[] = localData ? JSON.parse(localData) : INITIAL_RECIPES;

    const updatedRecipes = allRecipes.map(r => {
      if (r.id === id) {
        return {
          ...r,
          isHearted: false,
          heart: r.heart - 1 // 하트 개수 1 차감
        };
      }
      return r;
    });

    // 1) 전체 원본 데이터 로컬스토리지에 다시 굽기 (메인 페이지와 동기화)
    localStorage.setItem('user_recipes', JSON.stringify(updatedRecipes));

    // 2) 현재 내 화면 목록에서도 즉시 사라지게 반영
    setLikedRecipes(updatedRecipes.filter(r => r.isHearted === true));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', padding: '28px 40px', color: '#111' }}>

      {/* 뒤로가기 및 타이틀 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}
        >
          ⬅️
        </button>
        <div style={{ fontSize: '20px', fontWeight: 500 }}>❤️ 좋아요 한 레시피 ({likedRecipes.length})</div>
      </div>

      {/* 데이터가 없을 때의 예외 화면 */}
      {likedRecipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: '8px', border: '0.5px solid #eee' }}>
          <span style={{ fontSize: '48px' }}>🤍</span>
          <div style={{ marginTop: '16px', fontSize: '15px', color: '#666' }}>아직 좋아요 한 레시피가 없습니다.</div>
          <button
            onClick={() => navigate('/recipeMain')} // 본인 메인 루트 주소로 맞추세요
            style={{ marginTop: '16px', background: '#1D9E75', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
          >
            레시피 구경하러 가기
          </button>
        </div>
      ) : (
        /* 좋아요 목록 그리드 (Main 페이지 디자인과 일치화) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {likedRecipes.map(r => (
            <div
              key={r.id}
              style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden' }}
            >
              {/* 이미지/이모지 영역 */}
              <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                {r.emoji}
              </div>

              {/* 텍스트 내용 영역 */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '6px' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5, marginBottom: '10px' }}>{r.desc}</div>

                {/* 하단 인터랙션 영역 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#999' }}>
                    <span>⏱️ {r.time}분</span>
                    {/* 클릭하면 이 목록에서 바로 해제됨 */}
                    <span
                      onClick={(e) => handleRemoveLike(r.id, e)}
                      style={{ cursor: 'pointer', color: '#E05D5D', fontWeight: 'bold' }}
                    >
                      ❤️ {r.heart}
                    </span>
                    <span>⭐ {r.star}</span>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#fafafa', color: '#666' }}>
                    {r.cat}
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