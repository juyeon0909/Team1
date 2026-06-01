import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/RecipeMain.css';

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
  scrap: number;
  urgent: boolean;
  isHearted?: boolean;
  isScrapped?: boolean;
  mustIngredients: { name: string; quantity: string }[];
  selectIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  image: string;
}

const CATEGORY_DECODER: { [key: string]: string } = {
  KOR: '한식', YANG: '양식', JAN: '일식', CHN: '중식',
  GAN: '간식', YA: '야식', DIET: '다이어트', RAP: '밀프랩',
};

const getMatchBadgeClass = (match: number) => {
  if (match >= 100) return 'badge-match-full';
  if (match >= 80)  return 'badge-match-high';
  return 'badge-match-mid';
};

const RecipeMain = () => {
  const navigate = useNavigate();

  const [recipes,        setRecipes]        = useState<Recipe[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [sortBy,         setSortBy]         = useState('추천순');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeMatch,    setActiveMatch]    = useState('전체');
  const [activeTime,     setActiveTime]     = useState('전체');
  const [urgentOnly,     setUrgentOnly]     = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);
  const perPage = 6;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);

        // 1. 레시피 목록 (비로그인 포함 누구나)
        const response = await axiosInstance.get('/recipeMain');
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const mapped: Recipe[] = response.data.map((item: any) => ({
            id:                 item.recipeId    ?? item.id,
            name:               item.title,
            cat:                CATEGORY_DECODER[item.category] ?? item.category ?? '한식',
            time:               item.cookingTime,
            desc:               item.description,
            steps:              Array.isArray(item.steps) ? item.steps : [],
            mustIngredients:    item.mustIngredients   ?? [],
            selectIngredients:  item.selectIngredients ?? [],
            missingIngredients: item.missingIngredients ?? [],
            match:              item.match      ?? 0,
            emoji:              item.emoji      ?? '🍳',
            bg:                 item.bg         ?? '#E1F5EE',
            tags:               [CATEGORY_DECODER[item.category] ?? item.category ?? '한식', `${item.cookingTime}분`],
            heart:              item.likeCount  ?? 0,
            scrap:              item.scrapCount ?? 0,
            urgent:             item.urgent     ?? false,
            isHearted:          item.hearted    ?? false,
            isScrapped:         item.scrapped   ?? false,
            image:              item.image,
          }));

          // 2. 로그인 상태면 보관함 기반 매칭률을 받아 id별로 덮어쓰기
          const token = localStorage.getItem('accessToken');
          if (token) {
            try {
              const matchRes = await axiosInstance.get('/api/recipeMain/match', {
                headers: { Authorization: `Bearer ${token}` },
              });
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

  const toggleHeart = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let prev_isHearted = false;
    setRecipes(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        prev_isHearted = r.isHearted ?? false;
        const next = !r.isHearted;
        return { ...r, isHearted: next, heart: next ? r.heart + 1 : Math.max(0, r.heart - 1) };
      })
    );
    try {
      await axiosInstance.post(`/mypage/${id}/like`);
    } catch (err) {
      setRecipes(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, isHearted: prev_isHearted, heart: prev_isHearted ? r.heart + 1 : Math.max(0, r.heart - 1) }
            : r,
        )
      );
      console.error('좋아요 처리 실패:', err);
    }
  };

  const toggleScrap = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let prev_isScrapped = false;
    setRecipes(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        prev_isScrapped = r.isScrapped ?? false;
        const next = !r.isScrapped;
        return { ...r, isScrapped: next, scrap: next ? r.scrap + 1 : Math.max(0, r.scrap - 1) };
      })
    );
    try {
      await axiosInstance.post(`/recipeMain/${id}/clip`);
    } catch (err) {
      setRecipes(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, isScrapped: prev_isScrapped, scrap: prev_isScrapped ? r.scrap + 1 : Math.max(0, r.scrap - 1) }
            : r,
        )
      );
      console.error('스크랩 처리 실패:', err);
    }
  };

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter(r => {
      if (urgentOnly && !r.urgent) return false;
      if (activeCategory !== '전체' && r.cat !== activeCategory) return false;
      if (activeMatch === '100' && r.match < 100) return false;
      if (activeMatch === '70'  && r.match < 70)  return false;
      if (activeMatch === '50'  && r.match < 50)  return false;
      if (activeTime  === '15'  && r.time  > 15)  return false;
      if (activeTime  === '30'  && r.time  > 30)  return false;
      if (activeTime  === '60'  && r.time  > 60)  return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });

    if (sortBy === '추천순') result = [...result].sort((a, b) => b.match - a.match);
    if (sortBy === '인기순') result = [...result].sort((a, b) => b.heart - a.heart);
    if (sortBy === '최신순') result = [...result].sort((a, b) => b.id   - a.id);

    return result;
  }, [recipes, searchQuery, activeCategory, activeMatch, activeTime, urgentOnly, sortBy]);

  const totalPages   = Math.max(1, Math.ceil(filteredRecipes.length / perPage));
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
      </div>

      <div className="feed-content">
        <div className="recipe-grid">
          {pagedRecipes.map(r => (
            <div key={r.id} className="recipe-card" onClick={() => navigate(`/recipeMain/${r.id}`)}>
              <div className="card-emoji-wrapper" style={{ backgroundColor: r.bg, overflow: 'hidden' }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span className="card-emoji">{r.emoji}</span>
                )}
                <span className={`card-match-badge ${getMatchBadgeClass(r.match)}`}>
                  {r.match === 100 ? '100% 일치' : `${r.match}% 일치`}
                </span>
              </div>

              <div className="card-info">
                <div className="card-title-row">
                  <span className="card-category-tag">{r.cat}</span>
                  {r.urgent && <span className="card-urgent-tag">임박재료활용</span>}
                  <span className="card-name">{r.name}</span>
                </div>
                <div className="card-desc">{r.desc}</div>

                <div className="card-tags">
                  {r.tags.map(t => <span key={t} className="card-tag">{t}</span>)}
                </div>

                <div className="card-footer">
                  <div className="card-meta">
                    <span>⏱️ {r.time}분</span>
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
                  </div>
                </div>
              </div>
            </div>
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
};

export default RecipeMain;
