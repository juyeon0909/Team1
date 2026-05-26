import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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
  star: number;
  urgent: boolean;
  isHearted?: boolean;
  isScrapped?: boolean;
  mustIngredients: { name: string; quantity: string }[];
  selectIngredients: string[];
  missingIngredients: string[];
  steps: string[];
}

const INITIAL_RECIPES: Recipe[] = [
  {
    id: 1, name: '두부 계란찜', cat: '한식', time: 15, match: 100, emoji: '🍳', bg: '#E1F5EE', desc: '부드러운 두부와 계란의 초간단 한식 반찬', tags: ['초간단', '15분'], heart: 234, star: 48, urgent: true, isHearted: false, isScrapped: false,
    mustIngredients: [{ name: '두부', quantity: '1모' }, { name: '계란', quantity: '2개' }, { name: '대파', quantity: '1/4대' }],
    selectIngredients: ['멸치육수 1/2컵', '참기름 0.5T', '소금 약간'],
    missingIngredients: ['멸치육수', '참기름'],
    steps: ['두부를 2cm 두께로 썰어 내열 용기에 담아요.', '계란 2개에 멸치육수 1/2컵을 넣고 잘 풀어줍니다.', '두부 위에 계란물을 붓고 뚜껑을 닫아 약불에서 12분 쪄요.', '대파를 송송 썰어 올리고 참기름을 살짝 뿌려 완성!']
  },
  {
    id: 2, name: '대파 된장찌개', cat: '한식', time: 20, match: 85, emoji: '🥘', bg: '#FAEEDA', desc: '구수한 된장과 신선한 대파의 조화', tags: ['국물', '20분'], heart: 189, star: 35, urgent: true, isHearted: false, isScrapped: false,
    mustIngredients: [{ name: '대파', quantity: '1대' }, { name: '두부', quantity: '반모' }, { name: '된장', quantity: '2T' }],
    selectIngredients: ['감자 1개', '청양고추 1개'],
    missingIngredients: ['감자'],
    steps: ['냄비에 물을 붓고 된장을 채에 걸러 풀어줍니다.', '감자와 두부를 먹기 좋은 크기로 썰어 넣고 끓입니다.', '국물이 끓으면 송송 썬 대파와 고추를 넣어 한소끔 더 끓입니다.']
  },
  {
    id: 3, name: '치즈 오믈렛', cat: '양식', time: 10, match: 85, emoji: '🧀', bg: '#FCEBEB', desc: '촉촉하고 부드러운 프렌치 스타일 오믈렛', tags: ['양식', '10분'], heart: 305, star: 92, urgent: false, isHearted: false, isScrapped: false,
    mustIngredients: [{ name: '계란', quantity: '3개' }, { name: '모짜렐라 치즈', quantity: '50g' }, { name: '버터', quantity: '1T' }],
    selectIngredients: ['소금 약간', '후추 약간'],
    missingIngredients: ['모짜렐라 치즈'],
    steps: ['계란을 그릇에 깨 넣고 소금, 후추와 함께 잘 풀어줍니다.', '달군 팬에 버터를 녹인 후 계란물을 붓고 스크램블하듯 젓습니다.', '계란이 반숙 상태가 되면 치즈를 올리고 반으로 접어 모양을 잡습니다.']
  }
];

const RecipeMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlId } = useParams(); // URL 주소의 ID 값 감지

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const localData = localStorage.getItem('user_recipes');
    return localData ? JSON.parse(localData) : INITIAL_RECIPES;
  });

  // 주소창에 ID 유무에 따라 리스트/상세 뷰 스위칭
  const view = urlId ? 'detail' : 'list';
  const selectedRecipeId = urlId ? parseInt(urlId, 10) : null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mustIngredients, setMustIngredients] = useState<{ name: string; quantity: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('추천순');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeMatch, setActiveMatch] = useState('전체');
  const [activeTime, setActiveTime] = useState('전체');
  const [urgentOnly, setUrgentOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  const currentRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  useEffect(() => {
    if (currentRecipe) {
      setMustIngredients(
        currentRecipe.mustIngredients ? currentRecipe.mustIngredients.map(item => ({ ...item })) : []
      );
    }
  }, [currentRecipe]);

  useEffect(() => {
    const localData = localStorage.getItem('user_recipes');
    if (localData) setRecipes(JSON.parse(localData));
  }, [location.pathname]);

  useEffect(() => {
    if (location.state && location.state.newRecipe) {
      const incomingData = location.state.newRecipe;
      setRecipes(prevRecipes => {
        const localData = localStorage.getItem('user_recipes');
        const currentList: Recipe[] = localData ? JSON.parse(localData) : prevRecipes;
        const nextId = currentList.length > 0 ? Math.max(...currentList.map(r => r.id)) + 1 : 1;

        const completedRecipe: Recipe = {
          ...incomingData,
          id: nextId,
          heart: incomingData.heart ?? 0,
          star: incomingData.star ?? 0,
          isHearted: false,
          isScrapped: false,
          match: incomingData.match ?? 100,
          bg: incomingData.bg || '#E1F5EE',
          emoji: incomingData.emoji || '🍳'
        };
        return [completedRecipe, ...currentList];
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem('user_recipes', JSON.stringify(recipes));
  }, [recipes]);

  const toggleHeart = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isHearted: !r.isHearted, heart: !r.isHearted ? r.heart + 1 : Math.max(0, r.heart - 1) } : r));
  };

  const toggleScrap = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isScrapped: !r.isScrapped, star: !r.isScrapped ? r.star + 1 : Math.max(0, r.star - 1) } : r));
  };

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter(r => {
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
        return r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });

    if (sortBy === '추천순') result.sort((a, b) => b.match - a.match);
    if (sortBy === '인기순') result.sort((a, b) => b.heart - a.heart);
    if (sortBy === '최신순') result.sort((a, b) => b.id - a.id);
    if (sortBy === '리뷰순') result.sort((a, b) => b.star - a.star);

    return result;
  }, [recipes, searchQuery, activeCategory, activeMatch, activeTime, urgentOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecipes.slice(start, start + perPage);
  }, [filteredRecipes, currentPage]);

  const handleCookStart = () => {
    if (selectedRecipeId) {
      setRecipes(prev => prev.map(r => r.id === selectedRecipeId ? { ...r, mustIngredients: mustIngredients.map(item => ({ ...item })) } : r));
    }
    alert('요리를 시작합니다! 메인 목록으로 돌아갑니다.');
    setIsModalOpen(false);
    navigate('/recipeMain');
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...mustIngredients];
    updated[index] = { ...updated[index], quantity: value };
    setMustIngredients(updated);
  };

  const getMatchBadgeStyle = (match: number) => {
    if (match >= 100) return { bg: '#1D9E75', text: '#fff' };
    if (match >= 80) return { bg: '#639922', text: '#fff' };
    return { bg: '#BA7517', text: '#fff' };
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', color: '#111', position: 'relative' }}>
      {/* ─── VIEW 1: 목록 화면 ─── */}
      {view === 'list' && (
        <div>
          <div style={{ background: '#fff', borderBottom: '0.5px solid #eee', padding: '24px 40px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>레시피</div>
              <button
                style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                onClick={() => navigate('/recipeMain/register')}
              >
                레시피 등록
              </button>
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
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              >
                <option>추천순</option><option>최신순</option><option>인기순</option><option>리뷰순</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {['전체', '한식', '양식', '일식', '중식', '간식'].map(cat => (
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

          <div style={{ padding: '28px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', color: '#555' }}>
                <strong style={{ color: '#111', fontWeight: 500 }}>{filteredRecipes.length}개</strong>의 레시피
              </div>
              <div
                onClick={() => { setUrgentOnly(!urgentOnly); setCurrentPage(1); }}
                style={{ fontSize: '12px', color: '#791F1F', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer' }}
              >
                {urgentOnly ? '전체 레시피 보기' : '임박 재료 레시피만 보기'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {pagedRecipes.map(r => {
                const badge = getMatchBadgeStyle(r.match);
                return (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/recipeMain/${r.id}`)} // 주소창 이동
                    style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    {/* 이미지 영역 (화면상 ID 노출 태그 제거됨) */}
                    <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative' }}>
                      {r.emoji}
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: badge.bg, color: badge.text }}>
                        {r.match}% 일치
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#1D9E75', background: '#E1F5EE', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{r.cat}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', height: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#999' }}>
                        <span>⏱️ {r.time}분</span>
                        <span onClick={(e) => toggleHeart(r.id, e)} style={{ cursor: 'pointer', color: r.isHearted ? '#E05D5D' : '#999' }}>
                          {r.isHearted ? '❤️' : '🤍'} {r.heart}
                        </span>
                        <span onClick={(e) => toggleScrap(r.id, e)} style={{ cursor: 'pointer', color: r.isScrapped ? '#E05D5D' : '#999' }}>
                          {r.isScrapped ? '⭐' : '★'} {r.star}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '32px' }}>
                <button style={{ padding: '6px 12px', cursor: 'pointer' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <div
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      border: '0.5px solid #ccc', background: currentPage === page ? '#1D9E75' : '#fff', color: currentPage === page ? '#fff' : '#555'
                    }}
                  >
                    {page}
                  </div>
                ))}
                <button style={{ padding: '6px 12px', cursor: 'pointer' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>▶</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: 상세 화면 (화면상 ID 노출 태그 제거됨) ─── */}
      {view === 'detail' && currentRecipe && (
        <div style={{ padding: '28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => navigate('/recipeMain')}>
            <span>⬅️</span> <span style={{ fontSize: '13px', color: '#666' }}>레시피 목록으로</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
            <div>
              <div style={{ height: '220px', background: currentRecipe.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', marginBottom: '20px' }}>
                {currentRecipe.emoji}
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>{currentRecipe.name}</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>{currentRecipe.desc}</div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                  <span>⏱️ {currentRecipe.time}분</span>
                  <span onClick={(e) => toggleHeart(currentRecipe.id, e)} style={{ cursor: 'pointer', color: currentRecipe.isHearted ? '#E05D5D' : '#666' }}>
                    {currentRecipe.isHearted ? '❤️' : '🤍'} {currentRecipe.heart} 좋아요
                  </span>
                  <span onClick={(e) => toggleScrap(currentRecipe.id, e)} style={{ cursor: 'pointer', color: currentRecipe.isScrapped ? '#E05D5D' : '#666' }}>
                    {currentRecipe.isScrapped ? '⭐' : '★'} {currentRecipe.star} 스크랩
                  </span>
                </div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>조리 방법</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#666' }}>
                  {currentRecipe.steps && currentRecipe.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E1F5EE', color: '#085041', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '18px 20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>재료</div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>필수 재료</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px', fontSize: '13px' }}>
                  {currentRecipe.mustIngredients && currentRecipe.mustIngredients.map((ing, idx) => (
                    <div key={idx}>• {ing.name} {ing.quantity}</div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>선택 재료</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px' }}>
                  {currentRecipe.selectIngredients && currentRecipe.selectIngredients.map((ing, idx) => <div key={idx}>• {ing}</div>)}
                </div>
              </div>

              {currentRecipe.missingIngredients && currentRecipe.missingIngredients.length > 0 && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '8px' }}>🛒 없는 재료</div>
                  <div style={{ fontSize: '12px', color: '#A32D2D' }}>{currentRecipe.missingIngredients.join(', ')}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={(e) => toggleScrap(currentRecipe.id, e)} style={{ flex: 1, padding: '10px', background: currentRecipe.isScrapped ? '#BA7517' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {currentRecipe.isScrapped ? '★ 스크랩 취소' : '⭐ 스크랩'}
                </button>
                <button onClick={() => setIsModalOpen(true)} style={{ flex: 1, padding: '10px', background: '#0BA574', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  요리하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px' }}>🍳 사용할 재료 및 수량 확인</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {mustIngredients.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px' }}>• {item.name}</span>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    style={{ width: '100px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px'  }}>
              <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleCookStart} style={{ flex: 1.5, padding: '10px', background: '#0BA574', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>확인 및 요리시작</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
{/* 커밋 체크 */}
export default RecipeMain;