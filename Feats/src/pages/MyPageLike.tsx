import React, { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import type { RecipeView, RecipeDto } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import '../components/MyPage.css';

const SORT_OPTIONS = ['최신 등록순', '인기순', '요리시간 짧은순'];
const FILTER_CATEGORIES = ['all', '한식', '일식', '중식', '양식', '간식', '야식', '다이어트', '밀프랩'];

export default function LikedRecipes() {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [curFilter, setCurFilter] = useState('all');
  const [sortBy, setSortBy] = useState('최신 등록순');
  const [curSearch, setCurSearch] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchLikedRecipes = async () => {
      try {
        const res = await customAxios.get<(RecipeDto & { author?: string; scrappedAt?: string })[]>('/mypage/like');
        const mapped = (res.data ?? []).map(dto => ({
          ...toRecipeView(dto),
          author: dto.author ?? '',
          scrappedAt: dto.scrappedAt ?? '',
          isHearted: true, // 좋아요 목록이므로 항상 true
        }));
        setRecipes(mapped);
      } catch (error) {
        console.error('좋아요 내역 불러오기 실패:', error);
        setError('좋아요 내역을 불러오지 못했습니다.');
        setRecipes([]);
      }
    };
    fetchLikedRecipes();
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(timer);
  }, [showToast]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const handleToggleLike = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovingId(id);
    setTimeout(async () => {
      try {
        await customAxios.post(`/mypage/${id}/like`);
        setRecipes(prev => prev.filter(r => r.id !== id));
        triggerToast(`"${title}" 좋아요를 취소했습니다.`);
      } catch (error) {
        console.error('좋아요 취소 요청 실패:', error);
        alert('처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
        setRemovingId(null);
      }
    }, 300);
  };

  const filteredRecipes = useMemo(() => {
    return recipes
      .filter(r => {
        const matchesCategory = curFilter === 'all' || r.category === curFilter;
        const matchesSearch = r.title.toLowerCase().includes(curSearch.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === '인기순') return b.heart - a.heart;
        if (sortBy === '요리시간 짧은순') return a.time - b.time;
        if (a.scrappedAt && b.scrappedAt) return b.scrappedAt.localeCompare(a.scrappedAt);
        return b.id - a.id;
      });
  }, [recipes, curFilter, curSearch, sortBy]);

  return (
    <Container className="py-4">
      <div id="page-liked" className="page active">

        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div className="breadcrumb" style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>내 정보</span>
            <span style={{ color: '#ccc' }}>›</span>
            <span style={{ color: '#6abf69', fontWeight: 'bold' }}>좋아요 내역</span>
          </div>
        </div>

        <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>좋아요 내역</h2>

        {error && <div className="alert alert-danger mt-3" style={{ fontSize: '14px' }}>{error}</div>}

        <div className="card mt-4" style={{ borderRadius: '12px', border: '1px solid #eef2f5', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '18px' }}>❤️</div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>좋아요 누른 레시피</h3>
              <span style={{ background: '#6abf69', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {filteredRecipes.length}개
              </span>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', color: '#555', outline: 'none' }}
            >
              {SORT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {FILTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCurFilter(cat)}
                    style={{
                      padding: '6px 14px', border: '1px solid #eee', borderRadius: '20px',
                      fontSize: '13px', cursor: 'pointer',
                      background: curFilter === cat ? '#6abf69' : '#f8fafc',
                      color: curFilter === cat ? '#fff' : '#64748b',
                      fontWeight: curFilter === cat ? 'bold' : 'normal',
                    }}
                  >
                    {cat === 'all' ? '전체' : cat}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', background: '#fff', minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="결과 내 레시피 검색..."
                  value={curSearch}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCurSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#333' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {filteredRecipes.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💔</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569' }}>해당하는 레시피가 없습니다</div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: '#94a3b8' }}>마음에 드는 음식을 리스트에서 찜해보세요!</div>
                  <button
                    onClick={() => navigate('/recipeMain')}
                    style={{ marginTop: '16px', padding: '8px 16px', background: '#6abf69', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    레시피 둘러보기
                  </button>
                </div>
              ) : (
                filteredRecipes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/recipeMain/${r.id}`)}
                    style={{
                      border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden',
                      cursor: 'pointer', background: '#fff', position: 'relative',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
                      transition: 'transform 0.2s, opacity 0.3s',
                      opacity: removingId === r.id ? 0 : 1,
                      transform: removingId === r.id ? 'scale(0.95)' : 'none'
                    }}
                  >
                    
                    <div style={{
                      backgroundColor:'#f5f5f5',
                      height: '140px', position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px'
                    }}>
                      {r.image ? (
                        <img src={r.image} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>🍽️</span>
                      )}

                      {r.urgent && (
                        <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          임박재료
                        </span>
                      )}
                      <button
                        onClick={(e) => handleToggleLike(r.id, r.title, e)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                        title="좋아요 취소"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* 카드 본문 */}
                    <div style={{ padding: '14px' }}>
                      <span style={{ fontSize: '11px', color: '#6abf69', fontWeight: 'bold' }}>[{r.category}]</span>
                      <h4 style={{ margin: '4px 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
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

      {showToast && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30, 41, 59, 0.9)', color: '#fff', padding: '10px 22px', borderRadius: '30px',
          fontSize: '13px', zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '500'
        }}>
          {toastMessage}
        </div>
      )}
    </Container>
  );
}