import React, { useState, useMemo, useEffect } from 'react'; // 💡 useEffect 추가
import { useNavigate } from 'react-router-dom';
import { INITIAL_RECIPES, Recipe } from '../types/RecipeData';

const RecipeMain = () => {
  const navigate = useNavigate();

  // 2. 리액트 상태(State) 선언
  // 💡 수정: 브라우저 저장소(localStorage)에 기존 데이터가 있다면 불러오고, 없다면 초깃값을 씁니다.
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const localData = localStorage.getItem('user_recipes');
    return localData ? JSON.parse(localData) : INITIAL_RECIPES;
  });

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  // 필터용 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('추천순');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeMatch, setActiveMatch] = useState('전체');
  const [activeTime, setActiveTime] = useState('전체');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  // 💡 추가: 하트나 스크랩이 변경되어 recipes 상태가 바뀔 때마다 자동으로 브라우저 저장소에 동기화합니다.
  useEffect(() => {
    localStorage.setItem('user_recipes', JSON.stringify(recipes));
  }, [recipes]);

  // 좋아요(하트) 토글 기능 함수
  const toggleHeart = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecipes(prevRecipes =>
      prevRecipes.map(r => {
        if (r.id === id) {
          const isHearted = !r.isHearted;
          return {
            ...r,
            isHearted,
            heart: isHearted ? r.heart + 1 : r.heart - 1
          };
        }
        return r;
      })
    );
  };

  // 스크랩(별) 토글 기능 함수
  const toggleScrap = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecipes(prevRecipes =>
      prevRecipes.map(r => {
        if (r.id === id) {
          return {
            ...r,
            isScrapped: !r.isScrapped
          };
        }
        return r;
      })
    );
  };

  // 3. 검색 및 필터링 검색 로직
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      if (urgentOnly && !r.urgent) return false;
      if (activeCategory !== '전체' && r.cat !== activeCategory) return false;

      if (activeMatch === '100' && r.match < 100) return false;
      if (activeMatch === '70' && r.match < 70) return false;
      if (activeMatch === '50' && r.match < 50) return false;

      if (activeTime === '15' && r.time > 15) return false;
      if (activeTime === '30' && r.time > 30) return false;
      if (activeTime === '60' && r.time > 60) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesTags = r.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTags) return false;
      }
      return true;
    });
  }, [recipes, searchQuery, activeCategory, activeMatch, activeTime, urgentOnly]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecipes.slice(start, start + perPage);
  }, [filteredRecipes, currentPage]);

  const getMatchBadgeStyle = (match: number) => {
    if (match >= 100) return { bg: '#1D9E75', text: '#fff' };
    if (match >= 80) return { bg: '#639922', text: '#fff' };
    return { bg: '#BA7517', text: '#fff' };
  };

  const currentRecipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0];

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', color: '#111' }}>
      {/* ─── VIEW 1: 레시피 목록 화면 ─── */}
      {view === 'list' && (
        <div>
          {/* 서브 헤더 */}
          <div style={{ background: '#fff', borderBottom: '0.5px solid #eee', padding: '24px 40px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>레시피</div>

              {/* 상단 버튼 레이아웃 영역 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => navigate('/recipeMain/hearts')}
                  style={{ background: '#fff', border: '0.5px solid #ccc', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}
                >
                  ❤️ 좋아요 목록
                </button>
                <button
                  onClick={() => navigate('/recipeMain/scraps')}
                  style={{ background: '#fff', border: '0.5px solid #ccc', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}
                >
                  ★ 스크랩 목록
                </button>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  onClick={() => navigate('/recipeMain/register')}
                >
                   레시피 등록
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, background: '#fafafa', border: '0.5px solid #ccc', borderRadius: '8px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="레시피 이름 또는 재료로 검색..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%' }}
                />
              </div>
              <select
                style={{ fontSize: '13px', color: '#555', border: '0.5px solid #ccc', borderRadius: '6px', padding: '8px 12px', background: '#fff', cursor: 'pointer' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>추천순</option><option>최신순</option><option>인기순</option><option>리뷰순</option>
              </select>
            </div>

            {/* 카테고리 탭 리스트 */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {['전체', '한식', '양식', '일식', '중식', '간식', '야식', '다이어트', '밀프랩'].map(cat => (
                <div
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                  style={{
                    fontSize: '13px', padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
                    color: activeCategory === cat ? '#1D9E75' : '#666',
                    fontWeight: activeCategory === cat ? 500 : 'normal',
                    borderBottom: activeCategory === cat ? '2px solid #1D9E75' : '2px solid transparent'
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* 필터 칩 영역 */}
          <div style={{ background: '#fafafa', borderBottom: '0.5px solid #eee', padding: '12px 40px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#999' }}>재료 일치율</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: '전체', val: '전체' }, { label: '50% 이상', val: '50' },
                  { label: '70% 이상', val: '70' }, { label: '100% 일치', val: '100' }
                ].map(item => (
                  <div
                    key={item.val}
                    onClick={() => { setActiveMatch(item.val); setCurrentPage(1); }}
                    style={{
                      fontSize: '12px', padding: '5px 12px', borderRadius: '20px', border: '0.5px solid #ccc', cursor: 'pointer',
                      background: activeMatch === item.val ? (item.val === '50' || item.val === '70' ? '#BA7517' : '#1D9E75') : '#fff',
                      color: activeMatch === item.val ? '#fff' : '#555'
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: '0.5px', height: '20px', background: '#ccc' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#999' }}>조리 시간</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { label: '전체', val: '전체' }, { label: '15분 이하', val: '15' },
                  { label: '30분 이하', val: '30' }, { label: '60분 이하', val: '60' }
                ].map(item => (
                  <div
                    key={item.val}
                    onClick={() => { setActiveTime(item.val); setCurrentPage(1); }}
                    style={{
                      fontSize: '12px', padding: '5px 12px', borderRadius: '20px', border: '0.5px solid #ccc', cursor: 'pointer',
                      background: activeTime === item.val ? '#1D9E75' : '#fff', color: activeTime === item.val ? '#fff' : '#555'
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 메인 리스트 그리드 */}
          <div style={{ padding: '28px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', color: '#555' }}>
                <strong style={{ color: '#111', fontWeight: 500 }}>{filteredRecipes.length}개</strong>의 레시피를 찾았어요
              </div>
              <div
                onClick={() => { setUrgentOnly(!urgentOnly); setCurrentPage(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#791F1F',
                  background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer'
                }}
              >
                 <span>{urgentOnly ? '전체 레시피 보기' : '임박 재료 레시피만 보기'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {pagedRecipes.map(r => {
                const badge = getMatchBadgeStyle(r.match);
                return (
                  <div
                    key={r.id}
                    onClick={() => { setSelectedRecipeId(r.id); setView('detail'); }}
                    style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative' }}>
                      {r.emoji}
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: badge.bg, color: badge.text }}>
                        {r.match === 100 ? '100% 일치' : `${r.match}% 일치`}
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '6px' }}>{r.name}</div>
                      <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5, marginBottom: '10px' }}>{r.desc}</div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#fafafa', color: '#666' }}>{r.cat}</span>
                        {r.urgent && <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#FCEBEB', color: '#791F1F' }}>임박재료활용</span>}
                        {r.tags.map(t => <span key={t} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#fafafa', color: '#666' }}>{t}</span>)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#999' }}>
                          <span>⏱️ {r.time}분</span>
                          <span
                            onClick={(e) => toggleHeart(r.id, e)}
                            style={{ cursor: 'pointer', color: r.isHearted ? '#E05D5D' : '#999', fontWeight: r.isHearted ? 'bold' : 'normal' }}
                          >
                            {r.isHearted ? '❤️' : '🤍'} {r.heart}
                          </span>
                          <span>⭐ {r.star}</span>
                        </div>
                        <div
                          onClick={(e) => toggleScrap(r.id, e)}
                          style={{ fontSize: '12px', color: r.isScrapped ? '#BA7517' : '#999', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: r.isScrapped ? 'bold' : 'normal' }}
                        >
                          {r.isScrapped ? '★' : '☆'} 스크랩
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '32px' }}>
                <div style={{ width: '34px', height: '34px', border: '0.5px solid #ccc', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  ◀
                </div>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <div
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', cursor: 'pointer',
                      border: '0.5px solid #ccc',
                      background: currentPage === page ? '#1D9E75' : '#fff',
                      color: currentPage === page ? '#fff' : '#555'
                    }}
                  >
                    {page}
                  </div>
                ))}
                <div style={{ width: '34px', height: '34px', border: '0.5px solid #ccc', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  ▶
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: 레시피 상세 화면 ─── */}
      {view === 'detail' && (
        <div style={{ padding: '28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => setView('list')}>
            <span>⬅️</span>
            <span style={{ fontSize: '13px', color: '#666' }}>레시피 목록으로</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
            {/* 좌측 콘텐츠 영역 */}
            <div>
              <div style={{ height: '220px', background: currentRecipe.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', marginBottom: '20px' }}>
                {currentRecipe.emoji}
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>{currentRecipe.name}</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>{currentRecipe.desc}</div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666', alignItems: 'center' }}>
                  <span>⏱️ {currentRecipe.time}분</span>
                  <span
                    onClick={() => toggleHeart(currentRecipe.id)}
                    style={{ cursor: 'pointer', color: currentRecipe.isHearted ? '#E05D5D' : '#666', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {currentRecipe.isHearted ? '❤️' : '🤍'} {currentRecipe.heart} 좋아요
                  </span>
                  <span>👤 김주연</span>
                </div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>조리 방법</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  {[
                    '두부를 2cm 두께로 썰어 내열 용기에 담아요.',
                    '계란 2개에 멸치육수 1/2컵을 넣고 잘 풀어줍니다.',
                    '두부 위에 계란물을 붓고 뚜껑을 닫아 약불에서 12분 쪄요.',
                    '대파를 송송 썰어 올리고 참기름을 살짝 뿌려 완성!'
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E1F5EE', color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div style={{ paddingBottom: '14px', borderBottom: '0.5px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 500, color: '#085041' }}>이민</div>
                      <span style={{ fontWeight: 500 }}>이민지</span>
                      <span style={{ color: '#999', fontSize: '12px' }}>2026.05.01</span>
                      <span style={{ color: '#BA7517', fontSize: '12px' }}>★★★★★</span>
                    </div>
                    <div style={{ color: '#666', lineHeight: '1.5' }}>진짜 너무 쉽고 맛있어요! 냉장고에 두부랑 계란이 항상 있는데 이 레시피 덕분에 잘 소비하고 있어요.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 사이드바 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '18px 20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>재료</div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>필수 재료</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px', fontSize: '13px', color: '#333' }}>
                  <div>• 두부 1모</div><div>• 계란 2개</div><div>• 대파 1/4대</div>
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>선택 재료</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px', color: '#333' }}>
                  <div>• 멸치육수 1/2컵</div><div>• 참기름 0.5T</div><div>• 소금 약간</div>
                </div>
              </div>

              <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  🛒 없는 재료
                </div>
                <div style={{ fontSize: '12px', color: '#A32D2D', lineHeight: '1.6' }}>멸치육수, 참기름</div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '18px 20px' }}>
                <div style={{ background: '#fafafa', borderRadius: '6px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <span style={{ fontSize: '24px' }}>📺</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>유튜브 레시피 영상</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>youtube.com/watch?v=...</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>🔗</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => toggleScrap(currentRecipe.id)}
                  style={{
                    flex: 1, padding: '10px',
                    background: currentRecipe.isScrapped ? '#BA7517' : '#1D9E75',
                    color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {currentRecipe.isScrapped ? '★ 스크랩 취소' : '📌 스크랩'}
                </button>
                <button
                  onClick={() => navigate('/recipeMain/edit')}
                  style={{ padding: '10px 14px', background: '#fff', color: '#555', border: '0.5px solid #ccc', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  ️ 수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMain;