import { Button } from "react-bootstrap";
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import axios from "axios";
import type { RecipeView, RecipeDto } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import '../components/RecipeMain.css';
import type { User } from "../types/User";
import RecipeCard from '../pages/RecipeCard';

type RecipeProps = {
  user: User | null;
};

function RecipeMain({ user }: RecipeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('추천순');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeMatch, setActiveMatch] = useState('전체');
  const [activeTime, setActiveTime] = useState('전체');
  const [urgentOnly, setUrgentOnly] = useState(() => !!(location.state as any)?.urgentOnly);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<RecipeDto[]>('/recipeMain');
        if (Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map(toRecipeView);

          const token = localStorage.getItem('accessToken');
          if (token) {
            try {
              const matchRes = await axiosInstance.get('/recipeMain/match');
              if (Array.isArray(matchRes.data)) {
                const rateMap = new Map<number, number>(
                  matchRes.data.map((m: any) => [m.id, m.matchRate ?? 0]),
                );
                mapped.forEach(r => {
                  if (rateMap.has(r.id)) r.match = rateMap.get(r.id)!;
                });
              }
            } catch (matchErr) {
              console.error('매칭률 불러오기 실패:', matchErr);
            }
          }

          setRecipes(mapped);
        } else {
          setRecipes([]);
        }
      } catch (error) {
        console.error('서버 데이터 로딩 실패:', error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(recipes.length / perPage));
    if (currentPage > tp) setCurrentPage(tp);
  }, [recipes, currentPage]);

  const toggleHeart = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const original = recipes.find(r => r.id === id);
    if (!original) return;
    setRecipes(prev => prev.map(r =>
      r.id === id
        ? { ...r, isHearted: !r.isHearted, heart: r.isHearted ? r.heart - 1 : r.heart + 1 }
        : r
    ));
    try {
      await axiosInstance.post(`/mypage/${id}/like`);
    } catch (err) {
      setRecipes(prev => prev.map(r => r.id === id ? original : r));
      console.error('좋아요 처리 실패:', err);
    }
  };

  const toggleScrap = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const original = recipes.find(r => r.id === id);
    if (!original) return;
    setRecipes(prev => prev.map(r =>
      r.id === id
        ? { ...r, isScrapped: !r.isScrapped, scrap: r.isScrapped ? r.scrap - 1 : r.scrap + 1 }
        : r
    ));
    try {
      await axiosInstance.post(`/recipeMain/${id}/clip`);
    } catch (err) {
      setRecipes(prev => prev.map(r => r.id === id ? original : r));
      console.error('스크랩 처리 실패:', err);
    }
  };

  const handleEdit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/recipeMain/edit/${id}`);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 레시피를 삭제하시겠습니까?")) return;
    axiosInstance.delete(`/recipeMain/${id}`)
      .then(() => {
        alert("레시피가 성공적으로 삭제되었습니다.");
        setRecipes(prev => prev.filter(r => r.id !== id));
      })
      .catch((err) => {
        console.error("레시피 삭제 실패:", err);
        alert("삭제 중 오류가 발생했습니다.");
      });
  };

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter(r => {
      if (urgentOnly && !r.urgent) return false;
      if (activeCategory !== '전체' && r.category !== activeCategory) return false;
      if (activeMatch === '100' && r.match < 100) return false;
      if (activeMatch === '70' && r.match < 70) return false;
      if (activeMatch === '50' && r.match < 50) return false;
      if (activeTime === '15' && r.time > 15) return false;
      if (activeTime === '30' && r.time > 30) return false;
      if (activeTime === '60' && r.time > 60) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.title.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });

    if (sortBy === '추천순') result = [...result].sort((a, b) => b.match - a.match);
    if (sortBy === '인기순') result = [...result].sort((a, b) => b.heart - a.heart);
    if (sortBy === '최신순') result = [...result].sort((a, b) => b.id - a.id);

    return result;
  }, [recipes, searchQuery, activeCategory, activeMatch, activeTime, urgentOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecipes.slice(start, start + perPage);
  }, [filteredRecipes, currentPage]);

  if (loading) return <div className="loading-box">데이터를 확인하는 중...</div>;

  return (
    <div className="recipe-main-container">
      <div className="recipe-header">
        <div className="header-top">
          <div className="header-title">레시피</div>
          <button className="recipe-register-btn" onClick={() => navigate('/recipeMain/register')}>
            <span className="add-icon-small">＋</span> 레시피 등록
          </button>
        </div>

        <div className="search-sort-bar">
          <input
            type="text"
            placeholder="레시피 이름 또는 태그로 검색..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="search-input"
          />
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
          >
            <option>추천순</option>
            <option>최신순</option>
            <option>인기순</option>
          </select>
        </div>

        <div className="category-tabs">
          {['전체', '한식', '양식', '일식', '중식', '간식', '야식', '다이어트', '밀프랩'].map(cat => (
            <div
              key={cat}
              onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">재료 일치율</span>
          <div className="filter-chips">
            {[{ label: '전체', val: '전체' }, { label: '50% 이상', val: '50' },
            { label: '70% 이상', val: '70' }, { label: '100% 일치', val: '100' }].map(item => {
              const activeClass = activeMatch === item.val
                ? (item.val === '50' || item.val === '70') ? 'active-match-orange' : 'active-green'
                : '';
              return (
                <div key={item.val} onClick={() => { setActiveMatch(item.val); setCurrentPage(1); }}
                  className={`filter-chip ${activeClass}`}>{item.label}</div>
              );
            })}
          </div>
        </div>

        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-label">조리 시간</span>
          <div className="filter-chips">
            {[{ label: '전체', val: '전체' }, { label: '15분 이하', val: '15' },
            { label: '30분 이하', val: '30' }, { label: '60분 이하', val: '60' }].map(item => (
              <div key={item.val} onClick={() => { setActiveTime(item.val); setCurrentPage(1); }}
                className={`filter-chip ${activeTime === item.val ? 'active-green' : ''}`}>{item.label}</div>
            ))}
          </div>
        </div>

        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-label">임박 재료</span>
          <div className="filter-chips">
            <div
              onClick={() => { setUrgentOnly(false); setCurrentPage(1); }}
              className={`filter-chip ${!urgentOnly ? 'active-green' : ''}`}
            >
              전체
            </div>
            <div
              onClick={() => { setUrgentOnly(true); setCurrentPage(1); }}
              className={`filter-chip ${urgentOnly ? 'active-match-orange' : ''}`}
            >
              임박재료 활용
            </div>
          </div>
        </div>
      </div>

      <div className="feed-content">
        <div className="recipe-grid">
          {pagedRecipes.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onClick={(id) => navigate(`/recipeMain/${id}`)}
              metaExtra={
                <>
                  <button
                    className={`card-heart-btn ${r.isHearted ? 'hearted' : ''}`}
                    onClick={e => toggleHeart(r.id, e)}
                  >
                    {r.isHearted ? '❤️' : '🤍'} {r.heart}
                  </button>
                  <button
                    className={`card-scrap-btn ${r.isScrapped ? 'scrapped' : ''}`}
                    onClick={e => toggleScrap(r.id, e)}
                  >
                    {r.isScrapped ? '⭐' : '☆'} {r.scrap}
                  </button>
                </>
              }
              footer={
                user?.role === 'ADMIN' ? (
                  <div className="rc-admin-btn-group">
                    <button className="recipe-edit-btn" onClick={e => handleEdit(r.id, e)}>수정</button>
                    <button className="recipe-delete-btn" onClick={e => handleDelete(r.id, e)}>삭제</button>
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <button className="pagination-arrow" disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <div key={page} onClick={() => setCurrentPage(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}>{page}</div>
            ))}
            <button className="pagination-arrow" disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>▶</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeMain;