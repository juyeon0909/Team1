import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

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

// 💡 서버 연동 실패 혹은 데이터가 비어있을 때 활성화될 안심 백업 데이터
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
  const { id: urlId } = useParams();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const selectedRecipeId = urlId ? parseInt(urlId, 10) : null;

  useEffect(() => {
    setView(urlId ? 'detail' : 'list');
  }, [urlId]);

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
useEffect(() => {
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:9000/api/recipeMain', { withCredentials: true });

      // response.data가 존재하고 배열일 때만 매핑 실행
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mappedRecipes = response.data.map((item: any) => ({
          id: item.id,
          name: item.title,
          cat: item.category === 'KOR' ? '한식' : item.category === 'JAN' ? '일식' : item.category,
          time: item.cookingTime,
          desc: item.description,
          steps: item.steps || (item.cookingMethod ? item.cookingMethod.split('\n') : []),
          mustIngredients: item.mustIngredients || [],
          selectIngredients: [],
          missingIngredients: [],
          match: 100,
          emoji: '🍳',
          bg: '#E1F5EE',
          tags: [item.category, `${item.cookingTime}분`],
          heart: item.viewCount || 0,
          star: 0,
          urgent: false
        }));
        setRecipes(mappedRecipes);
      } else {
        // 서버에서 빈 배열을 주면 백업 데이터 세팅
        setRecipes(INITIAL_RECIPES);
      }
    } catch (error) {
      // 💡 백엔드에서 401이나 500 에러를 뱉어도 프론트가 뻗지 않도록 백업 데이터 주입!
      console.error("서버 데이터 로딩 실패 ➔ 백업 데이터 사용:", error);
      setRecipes(INITIAL_RECIPES);
    } finally {
      setLoading(false);
    }
  };
  fetchRecipes();
}, [navigate, location.pathname]);

  const currentRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  useEffect(() => {
    if (currentRecipe) {
      setMustIngredients(currentRecipe.mustIngredients ? currentRecipe.mustIngredients.map(item => ({ ...item })) : []);
    }
  }, [currentRecipe]);

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
    console.log("최종 사용할 재료 및 수량 데이터:", mustIngredients);
    alert('요리를 시작합니다! 메인 목록으로 돌아갑니다.');
    setIsModalOpen(false);
    navigate('/recipeMain');
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...mustIngredients];
    updated[index] = { ...updated[index], quantity: value };
    setMustIngredients(updated);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>데이터를 확인하는 중...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', color: '#111' }}>

      {/* ─── VIEW 1: 목록 화면 ─── */}
      {view === 'list' && (
        <div>
          <div style={{ background: '#fff', borderBottom: '0.5px solid #eee', padding: '24px 40px 10px' }}>
            {/* 상단 헤더 영역 문법 교정 완료 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>레시피</div>
              <div>
                <button
                  style={{ border: 'none', borderRadius: '3px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500, background: '#1D9E75', color: '#fff' }}
                  className="storage-add-btn"
                  onClick={() => navigate('/recipeMain/register')}
                >
                  <span className="add-icon-small">＋</span> 레시피 등록
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="레시피 이름 또는 태그로 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', outline: 'none' }}
              />
              <select
                style={{ fontSize: '13px', color: '#555', border: '1px solid #ccc', borderRadius: '6px', padding: '8px 12px', background: '#fff', cursor: 'pointer' }}
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              >
                <option>추천순</option><option>최신순</option><option>인기순</option><option>리뷰순</option>
              </select>
            </div>

            {/* 신규 카테고리 탭 목록 */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '10px' }}>
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

          {/* 🛠️ 일치율 및 조리시간 필터 칩 영역 */}
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

          {/* 피드 카드 본문 */}
          <div style={{ padding: '28px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {pagedRecipes.map(r => (
                <div key={r.id} onClick={() => navigate(`/recipeMain/${r.id}`)} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>{r.emoji}</div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#1D9E75', background: '#E1F5EE', padding: '1px 5px', borderRadius: '4px' }}>{r.cat}</span>
                      {r.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '32px' }}>
                <button style={{ padding: '6px 12px', cursor: 'pointer' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <div
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      border: '1px solid #ccc', background: currentPage === page ? '#1D9E75' : '#fff', color: currentPage === page ? '#fff' : '#555'
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

      {/* ─── VIEW 2: 상세 화면 ─── */}
      {view === 'detail' && currentRecipe && (
        <div style={{ padding: '28px 40px' }}>
          <button onClick={() => navigate('/recipeMain')} style={{ marginBottom: '20px', cursor: 'pointer', background: '#fff', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px' }}>⬅ 목록으로 돌아가기</button>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eee', maxWidth: '800px', margin: '0 auto' }}>
            <h2>{currentRecipe.name}</h2>
            <p style={{ color: '#666', borderBottom: '1px solid #eee', paddingBottom: '14px' }}>{currentRecipe.desc}</p>

            <h4>재료 목록</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', fontSize: '14px' }}>
              {currentRecipe.mustIngredients && currentRecipe.mustIngredients.map((ing, i) => (
                <div key={i}>• {ing.name} ({ing.quantity})</div>
              ))}
            </div>

            <h4>조리 순서</h4>
            {currentRecipe.steps && currentRecipe.steps.map((step, i) => (
              <div key={i} style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.5' }}>
                <strong>{i + 1}.</strong> {step}
              </div>
            ))}

            <button
              onClick={() => setIsModalOpen(true)}
              style={{ marginTop: '24px', width: '100%', padding: '12px', background: '#0BA574', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              요리 시작하기
            </button>
          </div>
        </div>
      )}

      {/* ─── 모달 팝업 레이어 ─── */}
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
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    style={{ width: '100px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>취소</button>
              <button onClick={handleCookStart} style={{ flex: 1.5, padding: '10px', background: '#0BA574', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>확인 및 요리시작</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMain;

/* 커밋 */