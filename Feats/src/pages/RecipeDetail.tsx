import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/RecipeMain.css';

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
  scrap: number;
  urgent: boolean;
  isHearted?: boolean;
  isScrapped?: boolean;
  mustIngredients: { name: string; quantity: string }[];
  selectIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  image: string;
}

const CATEGORY_DECODER: { [key: string]: string } = {
  KOR: '한식', YANG: '양식', JAN: '일식', CHN: '중식',
  GAN: '간식', YA: '야식', DIET: '다이어트', RAP: '밀프랩',
};

const RecipeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [recipe,          setRecipe]          = useState<Recipe | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [mustIngredients, setMustIngredients] = useState<{ name: string; quantity: string }[]>([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/recipeMain');
        if (response.data && Array.isArray(response.data)) {
          const mapped: Recipe[] = response.data.map((item: any) => ({
            id:                 item.recipeId    ?? item.id,
            name:               item.title,
            cat:                CATEGORY_DECODER[item.category] ?? item.category ?? '한식',
            time:               item.cookingTime,
            desc:               item.description,
            steps:              Array.isArray(item.steps) ? item.steps : [],
            mustIngredients:    item.mustIngredients   ?? [],
            selectIngredients:  item.selectIngredients ?? [],
            missingIngredients: item.missingIngredients ?? [],
            match:              item.match      ?? 0,
            emoji:              item.emoji      ?? '🍳',
            bg:                 item.bg         ?? '#E1F5EE',
            tags:               [CATEGORY_DECODER[item.category] ?? item.category ?? '한식', `${item.cookingTime}분`],
            heart:              item.likeCount  ?? 0,
            scrap:              item.scrapCount ?? 0,
            urgent:             item.urgent     ?? false,
            isHearted:          item.hearted    ?? false,
            isScrapped:         item.scrapped   ?? false,
            image:              item.image,
          }));
          const found = mapped.find(r => r.id === parseInt(id!, 10));
          if (found) {
            setRecipe(found);
            setMustIngredients(found.mustIngredients.map(i => ({ ...i })));
          }
        }
      } catch (error) {
        console.error('레시피 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const toggleHeart = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!recipe) return;
    const prev = recipe.isHearted ?? false;
    setRecipe({ ...recipe, isHearted: !prev, heart: prev ? Math.max(0, recipe.heart - 1) : recipe.heart + 1 });
    try {
      await axiosInstance.post(`/mypage/${recipe.id}/like`);
    } catch (err) {
      setRecipe(r => r && ({ ...r, isHearted: prev, heart: prev ? r.heart + 1 : Math.max(0, r.heart - 1) }));
      console.error('좋아요 처리 실패:', err);
    }
  };

  const toggleScrap = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!recipe) return;
    const prev = recipe.isScrapped ?? false;
    setRecipe({ ...recipe, isScrapped: !prev, scrap: prev ? Math.max(0, recipe.scrap - 1) : recipe.scrap + 1 });
    try {
      await axiosInstance.post(`/recipeMain/${recipe.id}/clip`);
    } catch (err) {
      setRecipe(r => r && ({ ...r, isScrapped: prev, scrap: prev ? r.scrap + 1 : Math.max(0, r.scrap - 1) }));
      console.error('스크랩 처리 실패:', err);
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...mustIngredients];
    updated[index] = { ...updated[index], quantity: value };
    setMustIngredients(updated);
  };

  const handleCookStart = async () => {
    if (!recipe) return;
    try {
      const token = localStorage.getItem('accessToken');
      const payload = mustIngredients.map(item => ({ name: item.name, quantity: item.quantity }));
      await axiosInstance.post(`/recipeMain/${recipe.id}/cook`, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      alert('요리가 완료되었습니다! 사용한 재료가 냉장고에서 차감되었습니다.');
      setIsModalOpen(false);
      navigate('/recipeMain');
    } catch (error: any) {
      console.error('요리하기 처리 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인 세션이 만료되었거나 로그인 상태가 아닙니다.');
      } else {
        alert('재료 차감 처리 중 서버 오류가 발생했습니다.');
      }
    }
  };

  if (loading) return <div className="loading-box">데이터를 확인하는 중...</div>;
  if (!recipe) return <div className="loading-box">레시피를 찾을 수 없습니다.</div>;

  return (
    <div className="recipe-main-container">
      <div className="detail-container">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}
          onClick={() => navigate('/recipeMain')}
        >
          <span>⬅️</span>
          <span style={{ fontSize: '13px', color: '#666' }}>레시피 목록으로</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
          <div>
            <div style={{
              height: '220px', background: recipe.bg, borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '72px', marginBottom: '20px', overflow: 'hidden',
            }}>
              {recipe.image ? (
                <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                recipe.emoji
              )}
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>{recipe.name}</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>{recipe.desc}</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                <span>⏱️ {recipe.time}분</span>
                <span
                  onClick={toggleHeart}
                  style={{ cursor: 'pointer', color: recipe.isHearted ? '#E05D5D' : '#666' }}
                >
                  {recipe.isHearted ? '❤️' : '🤍'} {recipe.heart} 좋아요
                </span>
                <span
                  onClick={toggleScrap}
                  style={{ cursor: 'pointer', color: recipe.isScrapped ? '#BA7517' : '#666' }}
                >
                  {recipe.isScrapped ? '⭐' : '☆'} {recipe.scrap} 스크랩
                </span>
              </div>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>조리 방법</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#666' }}>
                {recipe.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: '#E1F5EE', color: '#085041',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
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
                {recipe.mustIngredients.map((ing, idx) => (
                  <div key={idx}>• {ing.name} {ing.quantity}</div>
                ))}
              </div>

              <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>선택 재료</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px' }}>
                {recipe.selectIngredients.map((ing, idx) => (
                  <div key={idx}>• {ing}</div>
                ))}
              </div>
            </div>

            {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '8px' }}>🛒 없는 재료</div>
                <div style={{ fontSize: '12px', color: '#A32D2D' }}>
                  {recipe.missingIngredients.join(', ')}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={toggleScrap}
                style={{
                  flex: 1, padding: '10px',
                  background: recipe.isScrapped ? '#BA7517' : '#1D9E75',
                  color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
                }}
              >
                {recipe.isScrapped ? '★ 스크랩 취소' : '⭐ 스크랩'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{ flex: 1, padding: '10px', background: '#0BA574', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                요리하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div style={{ backgroundColor: '#fff', width: '360px', maxWidth: '90vw', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div className="modal-title">🍳 사용할 재료 및 수량 확인</div>
            <div className="modal-list">
              {mustIngredients.map((item, index) => (
                <div key={index} className="modal-item">
                  <span className="modal-item-name">• {item.name}</span>
                  <input
                    type="text"
                    value={item.quantity ?? ''}
                    onChange={e => handleQuantityChange(index, e.target.value)}
                    className="modal-item-input"
                  />
                </div>
              ))}
            </div>
            <div className="modal-btn-group">
              <button onClick={() => setIsModalOpen(false)} className="modal-cancel-btn">취소</button>
              <button onClick={handleCookStart} className="modal-confirm-btn">확인 및 요리시작</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
