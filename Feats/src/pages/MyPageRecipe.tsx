import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/MyPageRecipe.css';

interface Recipe {
  id: number;
  title: string;
  dishName: string;
  category: string;
  cookingTime: number;
  description: string;
  image?: string;
}

const TOKEN_KEY = 'accessToken';
const CATEGORIES = ['전체', '한식', '일식', '중식', '양식', '간식', '야식', '다이어트식', '밀프랩'];

const MyPageRecipe = () => {
  const navigate = useNavigate();
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    axiosInstance.get('/mypage/recipe', {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
      .then((res) => {
        setMyRecipes(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("내 레시피 목록 불러오기 실패:", err);
        setLoading(false);
      });
  }, []);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 레시피를 삭제하시겠습니까?")) return;

    const token = localStorage.getItem(TOKEN_KEY);

    axiosInstance.delete(`/mypage/recipe/${id}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
      .then(() => {
        alert("레시피가 성공적으로 삭제되었습니다.");
        setMyRecipes(myRecipes.filter(recipe => recipe.id !== id));
        navigate('/mypage/recipe');
      })
      .catch((err) => {
        console.error("레시피 삭제 실패:", err);
        alert("삭제 중 오류가 발생했습니다.");
        navigate('/mypage/recipe');
      });
  };

  if (loading) {
    return <div className="mypage-recipe-container mypage-loading-box">로딩 중...</div>;
  }

  return (
    <div className="mypage-recipe-container">
      <div className="top-nav-bar">
        <div className="back-to-main-link" onClick={() => navigate('/recipeMain')}>
          <i className="ti ti-arrow-left"></i>
          <span>메인으로</span>
        </div>
        <button
          onClick={() => navigate('/recipeMain/register')}
          style={{
            padding: '8px 16px',
            background: '#6FBC44',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          + 새 레시피 등록
        </button>
      </div>

      <h2 className="mypage-recipe-title">
        내가 등록한 레시피
      </h2>

      {myRecipes.length === 0 ? (
        <div className="empty-recipe-box">
          아직 등록한 레시피가 없습니다. 나만의 비법 레시피를 등록해보세요!
        </div>
      ) : (
        <div className="recipe-card-grid">
          {myRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => navigate(`/recipeMain/${recipe.id}`)}
              className="recipe-item-card"
            >
              <div className="recipe-card-image-box">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} className="recipe-card-img" />
                ) : (
                  <div className="recipe-card-no-img">🍳</div>
                )}
              </div>

              <div style={{ padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#6FBC44', fontWeight: 'bold' }}>{recipe.category}</span>
                <h3 style={{ fontSize: '14px', margin: '4px 0 6px 0', color: '#111', fontWeight: '500' }}>{recipe.dishName}</h3>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {recipe.description}
                </p>
              </div>

              <button
                onClick={(e) => handleDelete(recipe.id, e)}
                className="recipe-delete-absolute-btn"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPageRecipe;
