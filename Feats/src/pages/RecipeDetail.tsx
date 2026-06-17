import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import type { RecipeView, RecipeDto, IngredientDto, CookIngredient } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import '../components/RecipeMain.css';
import { notifyError } from '../utils/notifyError';

// 선택재료/없는재료 항목은 string 또는 {name, quantity} 두 가지 형태로 올 수 있어
// 이름만 안전하게 뽑아내기 위한 헬퍼
const getIngredientName = (ingredient: string | IngredientDto): string =>
  typeof ingredient === 'string' ? ingredient : ingredient.name;

const RecipeDetail = () => {
  const navigate = useNavigate();

  const [recipe,          setRecipe]          = useState<RecipeView | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  // 요리하기 모달에서 실제로 차감 대상이 되는 재료 목록
  // 필수 재료는 레시피에 지정된 수량을 그대로 사용하고,
  // 선택 재료는 무조건 0g을 기본값으로 시작해 사용자가 직접 수량을 입력해야 차감에 포함된다.
  const [cookIngredients, setCookIngredients] = useState<CookIngredient[]>([]);



  const { id } = useParams();

  // 로그인 가드
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인 후 이용 가능한 서비스입니다.');
      navigate('/member/login');
    }
  }, [navigate]);

  // 단건 상세 조회
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<RecipeDto>(`/recipeMain/${id}`);
        const view = toRecipeView(res.data);
        setRecipe(view);

        const missingNames = new Set(
          view.missingIngredients.map(m => getIngredientName(m))
        );

        // 필수 재료: 없는 재료는 제외하고, 레시피에 지정된 수량을 그대로 사용
        const availableMustIngredients: CookIngredient[] = view.mustIngredients
          .filter(i => !missingNames.has(i.name))
          .map(i => ({ ...i, optional: false }));

        // 선택 재료: 없는 재료는 제외하고, 수량은 무조건 0g부터 시작
        const availableSelectIngredients: CookIngredient[] = view.selectIngredients
          .filter(i => !missingNames.has(getIngredientName(i)))
          .map(i => ({ name: getIngredientName(i), quantity: 0, optional: true }));

        setCookIngredients([...availableMustIngredients, ...availableSelectIngredients]);
      } catch (error) {
        notifyError(error, '레시피 정보를 불러오지 못했습니다.');
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecipe();
  }, [id]);

  const toggleHeart = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!recipe) return;
    const original = recipe;
    setRecipe({
      ...recipe,
      isHearted: !recipe.isHearted,
      heart: recipe.isHearted ? recipe.heart - 1 : recipe.heart + 1,
    });
    try {
      await axiosInstance.post(`/mypage/${recipe.id}/like`);
    } catch (err) {
      setRecipe(original);
      notifyError(err, '좋아요 처리에 실패했습니다.');
    }
  };

  const toggleScrap = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!recipe) return;
    const original = recipe;
    setRecipe({
      ...recipe,
      isScrapped: !recipe.isScrapped,
      scrap: recipe.isScrapped ? recipe.scrap - 1 : recipe.scrap + 1,
    });
    try {
      await axiosInstance.post(`/recipeMain/${recipe.id}/clip`);
    } catch (err) {
      setRecipe(original);
      notifyError(err, '스크랩 처리에 실패했습니다.');
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...cookIngredients];
    updated[index] = { ...updated[index], quantity: value };
    setCookIngredients(updated);
  };

  const handleCookStart = async () => {
    if (!recipe) return;
    try {
      const payload = cookIngredients.map(item => ({
        name: item.name,
        quantity: parseInt(String(item.quantity).replace(/[^0-9]/g, ''), 10) || 0,
      }));
      await axiosInstance.post(`/recipeMain/${recipe.id}/cook`, payload);
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
          <span>⬅</span>
          <span style={{ fontSize: '13px', color: '#666' }}>레시피 목록으로</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
          <div>
            <div style={{
              height: '300px', background: recipe.bg, borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '72px', marginBottom: '20px', overflow: 'hidden',
            }}>
              {recipe.image ? (
                <img src={recipe.image} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                recipe.emoji
              )}
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>{recipe.title}</div>
              {recipe.author && <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>👤 {recipe.author}</div>}
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>{recipe.desc}</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                <span>⏱️ {recipe.time}분</span>
                <span>☉ {recipe.viewCount} 조회</span>
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
                  <div key={idx}>• {ing.name} {ing.quantity}g</div>
                ))}
              </div>

              <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>선택 재료</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px' }}>
                {recipe.selectIngredients.map((ing, idx) => (
                  <div key={idx}>
                  • {typeof ing === 'string'
                  ? ing
                  : `${ing.name}${ing.quantity != null && ing.quantity !== 0 ? ` ${ing.quantity}g` : ''}`}</div>
                ))}
              </div>
            </div>

            {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '8px' }}>🛒 없는 재료</div>
                <div style={{ fontSize: '12px', color: '#A32D2D' }}>
                  {recipe.missingIngredients.map((m, idx) => {
                    const name = getIngredientName(m);
                    const qty = typeof m === 'string' ? '' : (m.quantity != null ? `${m.quantity}g` : '');
                    return <div key={idx}>• {name} {qty}</div>;
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={toggleScrap}
                style={{
                  flex: 1, padding: '10px',
                  background: recipe.isScrapped ? '#BA7517' : '#6FBC44',
                  color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
                }}
              >
                {recipe.isScrapped ? '★ 스크랩 취소' : '⭐ 스크랩'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                style={{ flex: 1, padding: '10px', background: '#6FBC44', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
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
            {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
              <div style={{ marginBottom: '12px', fontSize: '12px', color: '#C0392B' }}>
                <div>없는 재료는 차감에서 제외됩니다.</div>
                <div>
                  ({recipe.missingIngredients.map(m => getIngredientName(m)).join(', ')})
                </div>
              </div>
            )}
            <div style={{ marginBottom: '8px', fontSize: '11px', color: '#999' }}>
              선택 재료는 기본 수량이 0g입니다. 사용한 만큼 직접 수량을 입력해야 차감에 포함됩니다.
            </div>
            <div className="modal-list">
              {cookIngredients.map((item, index) => (
                <div key={index} className="modal-item">
                  <span className="modal-item-name">
                    • {item.name}
                    {item.optional && (
                      <span style={{ color: '#999', fontSize: '11px', marginLeft: '4px' }}>(선택)</span>
                    )}
                  </span>
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
