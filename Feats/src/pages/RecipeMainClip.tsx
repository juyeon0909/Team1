import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/RecipeMainClip.css';

interface ScrapedRecipe {
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
  star: number;
  urgent: boolean;
  liked: boolean; // 좋아요(하트) 여부
  scrappedAt: string; // 스크랩 날짜
}

const INITIAL_SCRAPPED: ScrapedRecipe[] = [
  { id: 1, name: '두부 계란찜', cat: '한식', time: 15, match: 100, emoji: '🍳', bg: '#E1F5EE', desc: '부드러운 두부와 계란의 초간단 한식 반찬', tags: ['초간단', '15분'], heart: 234, star: 4.8, urgent: true, liked: true, scrappedAt: '2026.05.10' },
  { id: 4, name: '치즈 오믈렛', cat: '양식', time: 10, match: 85, emoji: '🧀', bg: '#FCEBEB', desc: '촉촉하고 부드러운 프렌치 스타일 오믈렛', tags: ['양식', '10분'], heart: 305, star: 4.9, urgent: false, liked: true, scrappedAt: '2026.05.08' },
  { id: 3, name: '애호박 볶음밥', cat: '한식', time: 10, match: 70, emoji: '🍜', bg: '#EAF3DE', desc: '냉장고 속 애호박을 활용한 간편 볶음밥', tags: ['간편식', '10분'], heart: 412, star: 4.7, urgent: true, liked: true, scrappedAt: '2026.05.05' },
  { id: 7, name: '파스타', cat: '양식', time: 20, match: 60, emoji: '🍝', bg: '#E1F5EE', desc: '집에서 즐기는 토마토 파스타', tags: ['양식', '20분'], heart: 280, star: 4.7, urgent: false, liked: true, scrappedAt: '2026.05.01' },
  { id: 6, name: '계란국', cat: '한식', time: 10, match: 100, emoji: '🍲', bg: '#E6F1FB', desc: '간단하게 뚝딱 만드는 따뜻한 계란국', tags: ['국물', '10분'], heart: 156, star: 4.5, urgent: true, liked: true, scrappedAt: '2026.04.28' },
  { id: 8, name: '두부 스테이크', cat: '양식', time: 15, match: 85, emoji: '🥩', bg: '#FAEEDA', desc: '두부로 만드는 든든한 채식 스테이크', tags: ['양식', '15분'], heart: 210, star: 4.6, urgent: true, liked: true, scrappedAt: '2026.04.20' },
];

const SORT_OPTIONS = ['최신 스크랩순', '별점순', '좋아요순'];
const CATEGORIES = ['전체', '한식', '양식', '일식', '중식', '간식'];

const RecipeScrap = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<ScrapedRecipe[]>(INITIAL_SCRAPPED);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('최신 스크랩순');
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  // 좋아요 토글 → 취소 시 즉시 목록에서 제거
  const handleHeartToggle = (id: number) => {
    setRemovingId(id); // 페이드 아웃 트리거
    setTimeout(() => {
      setRecipes(prev => prev.filter(r => r.id !== id));
      setRemovingId(null);
    }, 300);
  };

  // 필터 + 정렬
  const filtered = recipes
    .filter(r => {
      if (activeCategory !== '전체' && r.cat !== activeCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === '별점순') return b.star - a.star;
      if (sortBy === '좋아요순') return b.heart - a.heart;
      // 최신 스크랩순: scrappedAt 내림차순
      return b.scrappedAt.localeCompare(a.scrappedAt);
    });

  const getMatchBadgeClass = (match: number) => {
    if (match >= 100) return 'badge-match-full';
    if (match >= 80) return 'badge-match-high';
    return 'badge-match-mid';
  };

  return (
    <div className="scrap-page">

      {/* ── 서브 헤더 ── */}
      <div className="scrap-header">
        <div className="scrap-header-top">
          <button className="scrap-back-btn" onClick={() => navigate('/recipeMain')}>
            ⬅️ <span>레시피 목록으로</span>
          </button>
          <h2 className="scrap-title">내 스크랩</h2>
          <span className="scrap-count-badge">{recipes.length}개</span>
        </div>
        <p className="scrap-subtitle">스크랩을 누른 레시피를 모아볼 수 있어요 ⭐</p>

        {/* 검색 + 정렬 */}
        <div className="scrap-controls">
          <div className="scrap-search-box">
            <span>🔍</span>
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

        {/* 카테고리 탭 */}
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

      {/* ── 본문 ── */}
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
                >
                  {/* 카드 이미지 영역 */}
                  <div className="scrap-card-img" style={{ background: r.bg }}>
                    <span className="scrap-card-emoji">{r.emoji}</span>
                    <span className={`scrap-match-badge ${getMatchBadgeClass(r.match)}`}>
                      {r.match === 100 ? '100% 일치' : `${r.match}% 일치`}
                    </span>

                    {/* 빨간 하트 버튼 */}
                    <button
                      className="scrap-heart-btn liked"
                      onClick={() => handleHeartToggle(r.id)}
                      title="스크랩 취소"
                    >
                      ⭐
                    </button>
                  </div>

                  {/* 카드 내용 */}
                  <div className="scrap-card-body">
                    <div className="scrap-card-name">{r.name}</div>
                    <div className="scrap-card-desc">{r.desc}</div>

                    <div className="scrap-card-tags">
                      <span className="scrap-tag scrap-tag-cat">{r.cat}</span>
                      {r.urgent && <span className="scrap-tag scrap-tag-urgent">임박재료활용</span>}
                      {r.tags.map(t => <span key={t} className="scrap-tag">{t}</span>)}
                    </div>

                    <div className="scrap-card-footer">
                      <div className="scrap-card-meta">
                        <span>⏱️ {r.time}분</span>
                        <span>❤️ {r.heart}</span>
                        <span>⭐ {r.star}</span>
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
{/* 커밋 체크  */}
export default RecipeScrap;
