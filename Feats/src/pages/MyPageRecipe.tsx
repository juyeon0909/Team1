import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../components/MyPageRecipe.css'; // 💡 분리된 마이페이지 레시피 전용 CSS 임포트

interface Recipe {
  recipeId: number;
  title: string;
  dishName: string;
  category: string;
  cookingTime: number;
  description: string;
  image?: string;
}

const MyPageRecipe = () => {
  const navigate = useNavigate();
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 컴포넌트 마운트 시 백엔드 API에서 로드
  useEffect(() => {
    const token = localStorage.getItem('ssToken'); // 레시피 등록 페이지와 동일한 토큰 키 사용

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

  // 레시피 삭제 핸들러 (서버에 DELETE 요청)
  const handleDelete = (recipeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 레시피를 삭제하시겠습니까?")) return;

    axiosInstance.delete(`/recipeMain/${recipeId}`)
      .then(() => {
        alert("레시피가 성공적으로 삭제되었습니다.");
        setMyRecipes(myRecipes.filter(recipe => recipe.recipeId !== recipeId));
      })
      .catch((err) => {
        console.error("레시피 삭제 실패:", err);
        alert("삭제 중 오류가 발생했습니다.");
      });
  };

  if (loading) {
    return <div className="mypage-recipe-container mypage-loading-box">로딩 중...</div>;
  }

  return (
    <div className="mypage-recipe-container">
      {/* 상단 네비게이션 바 */}
      <div className="top-nav-bar">
        <div className="back-to-main-link" onClick={() => navigate('/recipeMain')}>
          <i className="ti ti-arrow-left"></i>
          <span>메인으로</span>
        </div>
        <button
          onClick={() => navigate('/recipeMain/register')}
          className="add-recipe-btn"
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
              key={recipe.recipeId}
              onClick={() => navigate(`/recipeMain/${recipe.recipeId}`)}
              className="recipe-item-card"
            >
              {/* 이미지 영역 */}
              <div className="recipe-card-image-box">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} className="recipe-card-img" />
                ) : (
                  <div className="recipe-card-no-img">🍳</div>
                )}
              </div>

              {/* 텍스트 컨텐츠 영역 */}
              <div className="recipe-card-content">
                <span className="recipe-card-category">{recipe.category}</span>
                <h3 className="recipe-card-title-text">{recipe.title}</h3>
                <p className="recipe-card-desc-text">
                  {recipe.description}
                </p>
              </div>

              {/* 카드 우상단 삭제(X) 버튼 */}
              <button
                onClick={(e) => handleDelete(recipe.recipeId, e)}
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