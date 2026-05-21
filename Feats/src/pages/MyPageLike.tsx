import React, { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance'; 
import { API_BASE_URL } from '../config/config';
import '../components/MyPage.css'; 

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

export default function LikedRecipes() {
  console.log('자바스크립트 코딩 영역 - 레시피 페이지에서 넘어온 좋아요 내역 확인');
  const navigate = useNavigate();

  // 상태 관리
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [curFilter, setCurFilter] = useState<string>('all');
  const [curSearch, setCurSearch] = useState<string>('');
  
  // 에러 및 토스트 상태
  const [error, setError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // 1. 최신 목록 데이터 로드
  useEffect(() => {
    const fetchLikedRecipes = async () => {
      try {
        const url = `${API_BASE_URL}/user/likes`; 
        const response = await customAxios.get(url);
        setRecipes(response.data || []);
      } catch (error) {
        console.error('좋아요 내역 불러오기 실패:', error);
        setError('좋아요 내역을 불러오지 못했습니다.');
        
        // 🛠️ API 연결 전 대안용 로컬 더미 데이터 테스트 활성화 (필요시 주석 제거)
        setRecipes([
          { id: 1, emoji: '🍳', title: '두부 계란찜', category: '한식', time: '15분', diff: '쉬움', author: '김주연', likes: 234, liked: true },
          { id: 4, emoji: '🧀', title: '치즈 오믈렛', category: '양식', time: '10분', diff: '쉬움', author: '김주연', likes: 305, liked: true }
        ]);
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

  // 2. 내역 페이지에서 바로 '좋아요 취소' 처리 함수
  const handleToggleLike = async (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 상세 이동 방지
    try {
      const url = `${API_BASE_URL}/recipe/${id}/like`; 
      await customAxios.post(url);

      // 리스트에서 자연스럽게 사라지도록 필터링 처리
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      triggerToast(`"${title}" 좋아요를 취소했습니다.`);
    } catch (error) {
      console.error('좋아요 취소 요청 실패:', error);
      alert('처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
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
    <Container className="py-4">
      <div id="page-liked" className="page active">
        {/* 네비게이션 브레드크럼 */}
        <div className="page-header">
          <div>
            <div className="breadcrumb" style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '8px' }}>
              <span className="link" style={{ cursor: 'pointer' }} onClick={() => navigate('/mypage/info')}>
                내 정보
              </span>
              <span>›</span>
              <span className="cur" style={{ color: 'var(--green)', fontWeight: 'bold' }}>좋아요 내역</span>
            </div>
            
            <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>
              좋아요 내역
            </h2>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mt-3" style={{ fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* 메인 리스트 카드 */}
        <div className="card mt-4">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon">❤️</div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>좋아요 누른 레시피</h2>
            <span className="badge-cnt" style={{ background: '#6abf69', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
              {filteredRecipes.length}개
            </span>
          </div>
          
          <div className="card-body">
            {/* 상단 필터 탭 & 검색바 */}
            <div className="list-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div className="tabs-filter" style={{ display: 'flex', gap: '6px' }}>
                {FILTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`tab-f ${curFilter === cat ? 'active' : ''}`}
                    onClick={() => setCurFilter(cat)}
                    style={{
                      padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', cursor: 'pointer',
                      background: curFilter === cat ? '#6abf69' : '#fff', color: curFilter === cat ? '#fff' : '#555'
                    }}
                  >
                    {cat === 'all' ? '전체' : cat}
                  </button>
                ))}
              </div>
              <div className="box-search" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 10px', background: '#fff' }}>
                <span style={{ fontSize: '14px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="결과 내 검색..."
                  value={curSearch}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCurSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* 그리드 레이아웃 */}
            <div className="grid-recipes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {filteredRecipes.length === 0 ? (
                <div className="state-empty" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <div className="e-ico" style={{ fontSize: '32px', marginBottom: '10px' }}>💡</div>
                  <div className="e-ttl" style={{ fontSize: '15px', fontWeight: 'bold', color: '#555' }}>해당하는 레시피가 없습니다</div>
                  <div className="e-sub" style={{ fontSize: '13px', marginTop: '4px' }}>레시피 보러가기 페이지에서 마음에 드는 음식을 찜해보세요!</div>
                </div>
              ) : (
                filteredRecipes.map((r) => (
                  <div 
                    key={r.id} 
                    className="item-card" 
                    onClick={() => navigate(`/recipeMain/${r.id}`)} // 클릭 시 레시피 리스트로 이동 (혹은 상세 뷰 연동 경로 지정)
                    style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: '#fff', position: 'relative' }}
                  >
                    <div
                      className="item-thumb"
                      style={{ backgroundColor: THUMB_BG[r.category] || '#f5f5f5', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative' }}
                    >
                      {r.emoji}
                      <button 
                        className="btn-heart" 
                        onClick={(e) => handleToggleLike(r.id, r.title, e)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                      >
                        ❤️
                      </button>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#6abf69', fontWeight: 'bold' }}>[{r.category}]</span>
                      <h4 style={{ margin: '4px 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{r.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
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

      {/* 실시간 알림 토스트 UI */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 20px', borderRadius: '20px',
          fontSize: '13px', zIndex: 2000, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {toastMessage}
        </div>
      )}
    </Container>
  );
}