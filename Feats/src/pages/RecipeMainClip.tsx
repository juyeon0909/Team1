import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RecipeView, RecipeDto } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import axiosInstance from '../api/axiosInstance';
import '../components/RecipeMainClip.css';


const SORT_OPTIONS = ['최신 스크랩순', '좋아요순'];
const CATEGORIES = ['전체', '한식', '일식', '중식', '양식', '간식', '야식', '다이어트식', '밀프랩'];

const getMatchBadgeClass = (match?: number) => {
  if (!match) return '';
  if (match >= 100) return 'badge-match-full';
  if (match >= 80)  return 'badge-match-high';
  return 'badge-match-mid';
};

const RecipeMainClip = () => {
  const navigate = useNavigate();
  const [recipes,        setRecipes]        = useState<RecipeView[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortBy,         setSortBy]         = useState('최신 스크랩순');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [removingId,     setRemovingId]     = useState<number | null>(null);

  useEffect(() => {
    axiosInstance.get('/recipeMain/clip')
      .then(res => {
        setRecipes(res.data);
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
      if (sortBy === '좋아요순') return b.likes - a.likes;
      return b.scrappedAt.localeCompare(a.scrappedAt);
    });

  if (loading) return <div className="scrap-page"><p style={{ padding: 32 }}>불러오는 중...</p></div>;
  if (error)   return <div className="scrap-page"><p style={{ padding: 32, color: 'red' }}>{error}</p></div>;

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
              {filtered.map(r => (
                <div
                  key={r.id}
                  className={`scrap-card ${removingId === r.id ? 'removing' : ''}`}
                  onClick={() => navigate(`/recipeMain/${r.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="scrap-card-img" style={{ background: r.bg ?? '#F0F0F0' }}>
             {r.image ? (
               <img src={r.image} alt={r.title} className="scrap-card-img-file" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
               <span className="scrap-card-emoji">{r.emoji ?? '🍽️'}</span>
             )}
                    {r.match !== undefined && (
                      <span className={`scrap-match-badge ${getMatchBadgeClass(r.match)}`}>
                        {r.match === 100 ? '100% 일치' : `${r.match}% 일치`}
                      </span>
                    )}
                    <button
                      className="scrap-heart-btn liked"
                      onClick={e => handleScrapToggle(r.id, e)}
                      title="스크랩 취소"
                    >
                      ⭐
                    </button>
                  </div>

                  <div className="scrap-card-body">
                    <div className="scrap-card-name">{r.title}</div>
                    {r.desc && <div className="scrap-card-desc">{r.desc}</div>}
                    <div className="scrap-card-tags">
                      <span className="scrap-tag scrap-tag-cat">{r.category}</span>
                      {r.urgent && <span className="scrap-tag scrap-tag-urgent">임박재료활용</span>}
                      {(r.tags ?? []).map(t => <span key={t} className="scrap-tag">{t}</span>)}
                    </div>
                    <div className="scrap-card-footer">
                      <div className="scrap-card-meta">
                        <span>⏱️ {r.time}</span>
                        <span>❤️ {r.likes}</span>
                      </div>
                      <span className="scrap-card-date">📌 {r.scrappedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecipeMainClip;