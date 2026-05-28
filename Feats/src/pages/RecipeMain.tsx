import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import '../components/RecipeMain.css'; // 💡 분리한 CSS 파일 임포트

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
        const response = await axios.get('/recipeMain', { withCredentials: true });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const categoryDecoder: { [key: string]: string } = {
            "KOR": "한식", "YANG": "양식", "JAN": "일식", "CHN": "중식",
            "GAN": "간식", "YA": "야식", "DIET": "다이어트", "RAP": "밀프랩"
          };

          const mappedRecipes = response.data.map((item: any) => {
            const korCategory = categoryDecoder[item.category] || item.category || '한식';
            return {
              id: item.recipeId || item.id, // ⚠️ 백엔드 Key가 recipeId일 확률이 높음 (MyPageRecipe 참고)
              name: item.title,
              cat: korCategory,
              time: item.cookingTime,
              desc: item.description,
              steps: Array.isArray(item.steps) ? item.steps : (item.description?.includes('선택 재료') ? [] : []),
              // 만약 서버에서 문자열로 준다면 item.steps || [] 또는 분할 처리 필요
              mustIngredients: item.mustIngredients || [],
              selectIngredients: [],
              missingIngredients: [],
              match: 100,
              emoji: '🍳',
              bg: '#E1F5EE',
              tags: [korCategory, `${item.cookingTime}분`],
              heart: item.viewCount || 0,
              star: 0,
              urgent: false
            };
          });
          setRecipes(mappedRecipes);
        } else {
          setRecipes(INITIAL_RECIPES);
        }
      } catch (error) {
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

  if (loading) return <div className="loading-box">데이터를 확인하는 중...</div>;

  return (
    <div className="recipe-main-container">

      {/* ─── VIEW 1: 목록 화면 ─── */}
      {view === 'list' && (
        <div>
          <div className="recipe-header">
            <div className="header-top">
              <div className="header-title">레시피</div>
              <div>
                <button
                  className="recipe-register-btn"
                  onClick={() => navigate('/recipeMain/register')}
                >
                  <span className="add-icon-small">＋</span> 레시피 등록
                </button>
              </div>
            </div>

            <div className="search-sort-bar">
              <input
                type="text"
                placeholder="레시피 이름 또는 태그로 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              >
                <option>추천순</option>
                <option>최신순</option>
                <option>인기순</option>
                <option>리뷰순</option>
              </select>
            </div>

            {/* 카테고리 탭 목록 */}
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

          {/* 일치율 및 조리시간 필터 칩 영역 */}
          <div className="filter-bar">
            <div className="filter-group">
              <span className="filter-label">재료 일치율</span>
              <div className="filter-chips">
                {[
                  { label: '전체', val: '전체' }, { label: '50% 이상', val: '50' },
                  { label: '70% 이상', val: '70' }, { label: '100% 일치', val: '100' }
                ].map(item => {
                  let activeClass = '';
                  if (activeMatch === item.val) {
                    activeClass = (item.val === '50' || item.val === '70') ? 'active-match-orange' : 'active-green';
                  }
                  return (
                    <div
                      key={item.val}
                      onClick={() => { setActiveMatch(item.val); setCurrentPage(1); }}
                      className={`filter-chip ${activeClass}`}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="filter-divider"></div>
            <div className="filter-group">
              <span className="filter-label">조리 시간</span>
              <div className="filter-chips">
                {[
                  { label: '전체', val: '전체' }, { label: '15분 이하', val: '15' },
                  { label: '30분 이하', val: '30' }, { label: '60분 이하', val: '60' }
                ].map(item => (
                  <div
                    key={item.val}
                    onClick={() => { setActiveTime(item.val); setCurrentPage(1); }}
                    className={`filter-chip ${activeTime === item.val ? 'active-green' : ''}`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 피드 카드 본문 */}
          <div className="feed-content">
            <div className="recipe-grid">
              {pagedRecipes.map(r => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/recipeMain/${r.id}`)}
                  className="recipe-card"
                >
                  {/* 동적 배경색(r.bg)만 인라인 처리 */}
                  <div className="card-emoji-wrapper" style={{ backgroundColor: r.bg }}>
                    {r.emoji}
                  </div>
                  <div className="card-info">
                    <div className="card-title-row">
                      <span className="card-category-tag">{r.cat}</span>
                      {r.name}
                    </div>
                    <div className="card-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-arrow"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  ◀
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <div
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </div>
                ))}
                <button
                  className="pagination-arrow"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: 상세 화면 ─── */}
      {view === 'detail' && currentRecipe && (
        <div className="detail-container">
          <button onClick={() => navigate('/recipeMain')} className="back-list-btn">
            ⬅ 목록으로 돌아가기
          </button>
          <div className="detail-card">
            <h2>{currentRecipe.name}</h2>
            <p className="detail-desc">{currentRecipe.desc}</p>

            <h4>재료 목록</h4>
            <div className="ingredients-list">
              {currentRecipe.mustIngredients && currentRecipe.mustIngredients.map((ing, i) => (
                <div key={i}>• {ing.name} ({ing.quantity})</div>
              ))}
            </div>

            <h4>조리 순서</h4>
            {currentRecipe.steps && currentRecipe.steps.map((step, i) => (
              <div key={i} className="step-item">
                <strong>{i + 1}.</strong> {step}
              </div>
            ))}

            <button onClick={() => setIsModalOpen(true)} className="start-cooking-btn">
              요리 시작하기
            </button>
          </div>
        </div>
      )}

      {/* ─── 모달 팝업 레이어 ─── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">🍳 사용할 재료 및 수량 확인</div>
            <div className="modal-list">
              {mustIngredients.map((item, index) => (
                <div key={index} className="modal-item">
                  <span className="modal-item-name">• {item.name}</span>
                  <input
                    type="text"
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    className="modal-item-input"
                  />
                </div>
              ))}
            </div>
            <div className="modal-btn-group">
              <button onClick={() => setIsModalOpen(false)} className="modal-cancel-btn">
                취소
              </button>
              <button onClick={handleCookStart} className="modal-confirm-btn">
                확인 및 요리시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMain;