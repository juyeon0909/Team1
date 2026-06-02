import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import type { RecipeView, RecipeDto } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import '../components/RecipeMain.css';

const getMatchBadgeClass = (match: number) => {
  if (match >= 100) return 'badge-match-full';
  if (match >= 80) return 'badge-match-high';
  return 'badge-match-mid';
};

const RecipeMain = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('추천순');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeMatch, setActiveMatch] = useState('전체');
  const [activeTime, setActiveTime] = useState('전체');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<RecipeDto[]>('/recipeMain');
        if (Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map(toRecipeView);

          // 로그인 상태면 보관함 기반 매칭률을 받아 id별로 덮어쓰기
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

  // currentPage 범위 클램핑
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
      {/* ...header / filter-bar 동일... */}
      <div className="feed-content">
        <div className="recipe-grid">
          {pagedRecipes.map(r => (
            <div key={r.id} className="recipe-card" onClick={() => navigate(`/recipeMain/${r.id}`)}>
              <div className="card-emoji-wrapper" style={{ backgroundColor: r.bg, overflow: 'hidden' }}>
                {r.image ? (
                  <img src={r.image} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span className="card-emoji">{r.emoji}</span>
                )}
                <span className={`card-match-badge ${getMatchBadgeClass(r.match)}`}>
                  {r.match >= 100 ? '100% 일치' : `${r.match}% 일치`}
                </span>
              </div>
              <div className="card-info">
                <div className="card-title-row">
                  <span className="card-category-tag">{r.category}</span>
                  {r.urgent && <span className="card-urgent-tag">임박재료활용</span>}
                  <span className="card-name">{r.title}</span>
                </div>
                <div className="card-desc">{r.desc}</div>
                <div className="card-tags">
                  {r.tags.map(t => <span key={t} className="card-tag">{t}</span>)}
                </div>
                <div className="card-footer">
                  <div className="card-meta">
                    <span>⏱️ {r.time}분</span>
                    <button className={`card-heart-btn ${r.isHearted ? 'hearted' : ''}`}
                      onClick={e => toggleHeart(r.id, e)}>
                      {r.isHearted ? '❤️' : '🤍'} {r.heart}
                    </button>
                    <button className={`card-scrap-btn ${r.isScrapped ? 'scrapped' : ''}`}
                      onClick={e => toggleScrap(r.id, e)}>
                      {r.isScrapped ? '⭐' : '☆'} {r.scrap}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* ...pagination 동일... */}
      </div>
    </div>
  );
};
export default RecipeMain;