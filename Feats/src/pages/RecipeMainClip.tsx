import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RecipeView, RecipeDto } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import axiosInstance from '../api/axiosInstance';
import RecipeCard from '../pages/RecipeCard';
import '../components/RecipeMainClip.css';

const SORT_OPTIONS = ['최신 스크랩순', '좋아요순'];
const CATEGORIES = ['전체', '한식', '일식', '중식', '양식', '간식', '야식', '다이어트', '밀프랩'];

const RecipeMainClip = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('최신 스크랩순');
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    axiosInstance.get('/recipeMain/clip')
      .then(res => {
        console.log('스크랩 응답 원본:', res.data[0]);
        const mapped = (res.data ?? []).map((r: any) => ({
          ...r,
          mustIngredients: r.mustIngredients ?? [],
          tags: r.tags ?? [],
          heart: r.heart ?? r.likes ?? 0,
          scrappedAt: r.scrappedAt ?? '',
          isScrapped: true,
        }));
        setRecipes(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('스크랩 목록 불러오기 실패:', err);
        setError('스크랩 목록을 불러오지 못했습니다.');
        setLoading(false);
      });
  }, []);

  const handleScrapToggle = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axiosInstance.post(`/recipeMain/${id}/clip`);
      const { scrapped } = res.data;
      if (!scrapped) {
        setRemovingId(id);
        setTimeout(() => {
          setRecipes(prev => prev.filter(r => r.id !== id));
          setRemovingId(null);
        }, 300);
      }
    } catch (e) {
      console.error('스크랩 취소 실패:', e);
    }
  };

  const filtered = recipes
    .filter(r => {
      if (activeCategory !== '전체' && r.category !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.tags ?? []).some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === '좋아요순') return b.heart - a.heart;
      return (b.scrappedAt ?? '').localeCompare(a.scrappedAt ?? '');
    });

  // 목록이 줄어들면 currentPage 범위 클램핑
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filtered.length / perPage));
    if (currentPage > tp) setCurrentPage(tp);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage]);

  if (loading) return <div className="scrap-page"><p style={{ padding: 32 }}>불러오는 중...</p></div>;
  if (error) return <div className="scrap-page"><p style={{ padding: 32, color: 'red' }}>{error}</p></div>;

  return (
    <div className="scrap-page">
      <div className="scrap-header">
        <div className="scrap-header-top">
          <button className="scrap-back-btn" onClick={() => navigate('/recipeMain')}>
            <span>레시피 목록으로</span>
          </button>
          <h2 className="scrap-title">내 스크랩</h2>
          <span className="scrap-count-badge">{recipes.length}개</span>
        </div>
        <p className="scrap-subtitle">스크랩을 누른 레시피를 모아볼 수 있어요</p>

        <div className="scrap-controls">
          <div className="scrap-search-box">
            <span></span>
            <input
              type="text"
              placeholder="스크랩한 레시피 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="scrap-sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="scrap-category-tabs">
          {CATEGORIES.map(cat => (
            <div
              key={cat}
              className={`scrap-cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="scrap-body">
        {filtered.length === 0 ? (
          <div className="scrap-empty">
            <div className="scrap-empty-icon">⭐</div>
            <p className="scrap-empty-title">스크랩한 레시피가 없어요</p>
            <p className="scrap-empty-sub">마음에 드는 레시피에 ⭐를 눌러 저장해 보세요</p>
            <button className="scrap-go-btn" onClick={() => navigate('/recipeMain')}>
              레시피 둘러보기
            </button>
          </div>
        ) : (
          <>
            <div className="scrap-result-info">
              <strong>{filtered.length}개</strong>의 스크랩 레시피
            </div>
            <div className="scrap-grid">
              {pagedRecipes.map(r => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  className={removingId === r.id ? 'removing' : ''}
                  onClick={(id) => navigate(`/recipeMain/${id}`)}
                  imageAction={
                    <button className="scrap-heart-btn liked"
                      onClick={e => handleScrapToggle(r.id, e)} title="스크랩 취소">⭐</button>
                  }
                  metaExtra={
                    <>
                      <span>❤️ {r.heart}</span>
                      {r.scrappedAt && <span className="scrap-card-date">📌 {r.scrappedAt}</span>}
                    </>
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
          </>
        )}
      </div>
    </div>
  );
};

export default RecipeMainClip;
