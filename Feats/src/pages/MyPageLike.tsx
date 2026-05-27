import React, { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import '../components/MyPage.css';
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
  star?: number;       // 확장성을 위해 추가 (선택사항)
  urgent?: boolean;    // 임박재료 활용 여부 (선택사항)
  scrappedAt?: string; // 정렬용 날짜 데이터 (선택사항)
}

const THUMB_BG: Record<string, string> = {
  한식: '#e8f5e9',
  양식: '#fce4ec',
  일식: '#e3f2fd',
  중식: '#fff8e1',
  다이어트: '#f3e5f5',
};

const SORT_OPTIONS = ['최신 등록순', '인기순', '요리시간 짧은순'];
const FILTER_CATEGORIES = ['all', '한식', '양식', '일식', '중식', '다이어트'];

export default function LikedRecipes() {
  const navigate = useNavigate();

  // 상태 관리
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [curFilter, setCurFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('최신 등록순');
  const [curSearch, setCurSearch] = useState<string>('');
  const [removingId, setRemovingId] = useState<number | null>(null); // 애니메이션용 상태

  // 에러 및 토스트 상태
  const [error, setError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // 1. 데이터 로드
  useEffect(() => {
    const fetchLikedRecipes = async () => {
      try {
        const url = `${API_BASE_URL}/mypage/like`;;
        const response = await customAxios.get(url);
        setRecipes(response.data || []);
      } catch (error) {
        console.error('좋아요 내역 불러오기 실패:', error);
        setError('좋아요 내역을 불러오지 못했습니다.');
        setRecipes([]);

      }
    };

    fetchLikedRecipes();
  }, []);

  // 토스트 타이머
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(timer);
  }, [showToast]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  // 2. 애니메이션이 포함된 좋아요 취소 처리 함수
  const handleToggleLike = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 상세 이동 방지

    // 0.3초간 페이드아웃 효과를 주기 위해 제거할 ID 저장
    setRemovingId(id);

    setTimeout(async () => {
      try {
        const url = `${API_BASE_URL}/recipe/${id}/like`;
        await customAxios.post(url);

        // 실제 리스트에서 제거 및 상태 초기화
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        triggerToast(`"${title}" 좋아요를 취소했습니다.`);
      } catch (error) {
        console.error('좋아요 취소 요청 실패:', error);
        alert('처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
        setRemovingId(null); // 실패 시 되돌림
      }
    }, 300); // CSS transition 시간과 맞춰줍니다.
  };

  // 3. 필터, 검색 및 정렬 적용 (useMemo 최적화)
  const filteredRecipes = useMemo(() => {
    return recipes
      .filter((r) => {
        const matchesCategory = curFilter === 'all' || r.category === curFilter;
        const matchesSearch = r.title.toLowerCase().includes(curSearch.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === '인기순') {
          return b.likes - a.likes;
        }
        if (sortBy === '요리시간 짧은순') {
          const timeA = parseInt(a.time) || 0;
          const timeB = parseInt(b.time) || 0;
          return timeA - timeB;
        }
        // 기본: 최신 등록순 (id 역순 혹은 scrappedAt 기준)
        if (a.scrappedAt && b.scrappedAt) {
          return b.scrappedAt.localeCompare(a.scrappedAt);
        }
        return b.id - a.id;
      });
  }, [recipes, curFilter, curSearch, sortBy]);

  return (
    <Container className="py-4">
      <div id="page-liked" className="page active">

        {/* 네비게이션 브레드크럼 */}
        <div className="page-header" style={{ marginBottom: '20px' }}>
          <div className="breadcrumb" style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '8px' }}>
            <span className="link" style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>
              내 정보
            </span>
            <span style={{ color: '#ccc' }}>›</span>
            <span className="cur" style={{ color: '#6abf69', fontWeight: 'bold' }}>좋아요 내역</span>
          </div>
        </div>
        <div>
          <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>좋아요 내역</h2>
        </div>
        
        {error && (
          <div className="alert alert-danger mt-3" style={{ fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* 메인 리스트 카드 */}
        <div className="card mt-4" style={{ borderRadius: '12px', border: '1px solid #eef2f5', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="icon" style={{ fontSize: '18px' }}>❤️</div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#333' }}>좋아요 누른 레시피</h3>
              <span className="badge-cnt" style={{ background: '#6abf69', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {filteredRecipes.length}개
              </span>
            </div>

            {/* 첫 번째 코드의 정렬 셀렉트 박스 도입 */}
            <select
              className="scrap-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', color: '#555', outline: 'none' }}
            >
              {SORT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            {/* 상단 필터 탭 & 검색바 */}
            <div className="list-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div className="tabs-filter" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {FILTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`tab-f ${curFilter === cat ? 'active' : ''}`}
                    onClick={() => setCurFilter(cat)}
                    style={{
                      padding: '6px 14px', border: '1px solid #eee', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                      background: curFilter === cat ? '#6abf69' : '#f8fafc',
                      color: curFilter === cat ? '#fff' : '#64748b',
                      fontWeight: curFilter === cat ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat === 'all' ? '전체' : cat}
                  </button>
                ))}
              </div>

              <div className="box-search" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', background: '#fff', minWidth: '240px' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="결과 내 레시피 검색..."
                  value={curSearch}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCurSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '13px', width: '100%', color: '#333' }}
                />
              </div>
            </div>

            {/* 그리드 레이아웃 */}
            <div className="grid-recipes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {filteredRecipes.length === 0 ? (
                <div className="state-empty" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  <div className="e-ico" style={{ fontSize: '40px', marginBottom: '12px' }}>💔</div>
                  <div className="e-ttl" style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569' }}>해당하는 레시피가 없습니다</div>
                  <div className="e-sub" style={{ fontSize: '13px', marginTop: '6px', color: '#94a3b8' }}>마음에 드는 음식을 리스트에서 찜해보세요!</div>
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
                    className={`item-card ${removingId === r.id ? 'removing' : ''}`}
                    onClick={() => navigate(`/recipeMain/${r.id}`)}
                    style={{
                      border: '1px solid #f1f5f9',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#fff',
                      position: 'relative',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
                      transition: 'transform 0.2s, opacity 0.3s',
                      opacity: removingId === r.id ? 0 : 1, // 사라지는 애니메이션 투명도 조절
                      transform: removingId === r.id ? 'scale(0.95)' : 'none'
                    }}
                  >
                    {/* 카드 썸네일 영역 */}
                    <div
                      className="item-thumb"
                      style={{ backgroundColor: THUMB_BG[r.category] || '#f5f5f5', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', position: 'relative' }}
                    >
                      {r.emoji}

                      {/* 태그 컴포넌트 추가 (임박재료 활용이 활성화되어 있을 때만 렌더) */}
                      {r.urgent && (
                        <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: '#ef4444', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          임박재료
                        </span>
                      )}

                      <button
                        className="btn-heart"
                        onClick={(e) => handleToggleLike(r.id, r.title, e)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                        title="좋아요 취소"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* 카드 본문 영역 */}
                    <div style={{ padding: '14px' }}>
                      <span style={{ fontSize: '11px', color: '#6abf69', fontWeight: 'bold' }}>[{r.category}]</span>
                      <h4 style={{ margin: '4px 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span>⏱️ {r.time}</span>
                          {r.star && <span style={{ color: '#f59e0b' }}>⭐ {r.star}</span>}
                        </div>
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

      {/* 실시간 알림 토스트 UI */}
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