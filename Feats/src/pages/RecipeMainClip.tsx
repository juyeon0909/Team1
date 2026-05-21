import React, { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import { API_BASE_URL } from '../config/config';

interface Recipe {
  id: number;
  emoji: string;
  title: string;
  category: string;
  time: string;
  diff: string;
  author: string;
  likes: number;
  liked: boolean;
}

const THUMB_BG: Record<string, string> = {
  한식: '#e8f5e9',
  양식: '#fce4ec',
  일식: '#e3f2fd',
  중식: '#fff8e1',
  다이어트: '#f3e5f5',
};

const FILTER_CATEGORIES = ['all', '한식', '양식', '일식', '중식', '다이어트'];

export default function RecipeMainClip() {
  // 💡 사용자가 제공한 콘솔 위치 매칭 확인용
  console.log('자바스크립트 코딩 영역 - 레시피 페이지에서 넘어온 스크랩 내역 확인');

  const navigate = useNavigate();

  // 상태 관리 (초기값으로 확실하게 더미 데이터를 넣어두어 서버가 꺼져있어도 화면이 뜨게 만듭니다)
  const [recipes, setRecipes] = useState<Recipe[]>([
    { id: 1, emoji: '🍳', title: '두부 계란찜', category: '한식', time: '15분', diff: '쉬움', author: '김주연', likes: 234, liked: true },
    { id: 4, emoji: '🧀', title: '치즈 오믈렛', category: '양식', time: '10분', diff: '쉬움', author: '김주연', likes: 305, liked: true }
  ]);

  const [curFilter, setCurFilter] = useState<string>('all');
  const [curSearch, setCurSearch] = useState<string>('');

  // 1. 최신 목록 데이터 로드 (실패해도 기존 더미데이터 유지하도록 안전하게 변경)
  useEffect(() => {
    const fetchClipRecipes = async () => {
      try {
        const url = `${API_BASE_URL}/user/clip`;
        const response = await customAxios.get(url);
        // 서버 데이터가 정상적으로 존재할 때만 상태 업데이트
        if (response.data && response.data.length > 0) {
          setRecipes(response.data);
        }
      } catch (error) {
        console.error('스크랩 내역 서버 불러오기 실패 -> 로컬 더미 데이터 고정:', error);
        // catch 블록에서 아무것도 안 지우고 기존 더미데이터를 유지시킵니다.
      }
    };

    fetchClipRecipes();
  }, []);

  // 2. 스크랩 취소 처리 함수
  const handleToggleClip = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${API_BASE_URL}/recipe/${id}/clip`;
      await customAxios.post(url);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('스크랩 취소 요청 실패 -> 프론트 단독 강제 삭제 실행:', error);
      // 서버 에러가 나더라도 화면에서 지워지는 모습을 볼 수 있도록 처리
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // 필터 및 검색 최적화 적용
  const filteredRecipes = useMemo(() => {
    return recipes.filter(
      (r) =>
        (curFilter === 'all' || r.category === curFilter) &&
        r.title.toLowerCase().includes(curSearch.toLowerCase())
    );
  }, [recipes, curFilter, curSearch]);

    return (
        <>

          {/* 상단 필터 탭 & 검색바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCurFilter(cat)}
                  style={{
                    padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
                    background: curFilter === cat ? '#6abf69' : '#fff',
                    color: curFilter === cat ? '#fff' : '#64748b',
                    fontWeight: curFilter === cat ? 'bold' : 'normal'
                  }}
                >
                  {cat === 'all' ? '전체' : cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', background: '#fff', minWidth: '240px' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔍</span>
              <input
                type="text"
                placeholder="결과 내 검색..."
                value={curSearch}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCurSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%' }}
              />
            </div>
          </div>

          {/* 그리드 카드 레이아웃 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {filteredRecipes.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569' }}>스크랩한 레시피가 없습니다</div>
              </div>
            ) : (
              filteredRecipes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/recipeMain/${r.id}`)}
                  style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: '#fff', position: 'relative' }}
                >
                  {/* 상단 이모지 영역 */}
                  <div style={{ backgroundColor: THUMB_BG[r.category] || '#f1f5f9', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', position: 'relative' }}>
                    {r.emoji}
                    <button
                      onClick={(e) => handleToggleClip(r.id, r.title, e)}
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}
                    >
                      🔖
                    </button>
                  </div>
                  {/* 하단 설명 영역 */}
                  <div style={{ padding: '16px', textAlign: 'left' }}>
                    <span style={{ fontSize: '12px', color: '#6abf69', fontWeight: 'bold' }}>[{r.category}]</span>
                    <h4 style={{ margin: '6px 0 12px 0', fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>{r.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>⏱️ {r.time}</span>
                      <span>👤 {r.author}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}