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

const RecipeMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlId } = useParams();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // 💡 백엔드 API 연동 데이터 페칭
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:9000/api/recipeMain', { withCredentials: true });

        const mappedRecipes = response.data.map((item: any) => ({
          id: item.id,
          name: item.title,
          cat: item.category,
          time: item.cookingTime,
          desc: item.description,
          steps: item.steps || [],
          mustIngredients: item.mustIngredients || [],
          selectIngredients: [],
          missingIngredients: [],
          match: 100,
          emoji: '🍳',
          bg: '#E1F5EE',
          tags: [item.category, `${item.cookingTime}분`],
          heart: 0,
          star: 0,
          urgent: false
        }));
        setRecipes(mappedRecipes);
      } catch (error: any) {
        console.error("데이터 로딩 실패:", error);
        if (error.response?.status === 401) {
          alert("로그인이 필요합니다.");
          navigate('/login');
        }
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
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q);
      }
      return true;
    });
    return result;
  }, [recipes, searchQuery, activeCategory, urgentOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecipes.slice(start, start + perPage);
  }, [filteredRecipes, currentPage]);

  const handleCookStart = () => {
    alert('요리를 시작합니다!');
    setIsModalOpen(false);
    navigate('/recipeMain');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>서버에서 데이터를 받아오는 중...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', color: '#111' }}>
      {view === 'list' && (
        <div>
          <div style={{ background: '#fff', borderBottom: '0.5px solid #eee', padding: '24px 40px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>레시피 피드</div>
              <button
                style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
                onClick={() => navigate('/recipeMain/register')}
              >
                레시피 등록하기
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ padding: '28px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {pagedRecipes.map(r => (
                <div key={r.id} onClick={() => navigate(`/recipeMain/${r.id}`)} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>{r.emoji}</div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{r.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'detail' && currentRecipe && (
        <div style={{ padding: '28px 40px' }}>
          <button onClick={() => navigate('/recipeMain')} style={{ marginBottom: '20px', cursor: 'pointer' }}>⬅ 목록으로 돌아가기</button>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eee' }}>
            <h2>{currentRecipe.name}</h2>
            <p style={{ color: '#666' }}>{currentRecipe.desc}</p>
            <h4>조리 순서</h4>
            {currentRecipe.steps.map((step, i) => <div key={i} style={{ marginBottom: '6px' }}>{i+1}. {step}</div>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMain;