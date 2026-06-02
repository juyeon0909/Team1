import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import type { RecipeView, RecipeDto } from '../types/Recipe';
import { toRecipeView } from '../types/recipeMapper';
import RecipeCard from '../pages/RecipeCard';
import '../components/MyPageRecipe.css';

const TOKEN_KEY = 'accessToken';

const MyPageRecipe = () => {
  const navigate = useNavigate();
  const [myRecipes, setMyRecipes] = useState<RecipeView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    axiosInstance.get<RecipeDto[]>('/mypage/recipe', {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
      .then((res) => {
        const mapped = (res.data ?? []).map(toRecipeView);
        setMyRecipes(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("내 레시피 목록 불러오기 실패:", err);
        setLoading(false);
      });
  }, []);

  // 목록이 줄어들면 currentPage 범위 클램핑
  useEffect(() => {
    const tp = Math.max(1, Math.ceil(myRecipes.length / perPage));
    if (currentPage > tp) setCurrentPage(tp);
  }, [myRecipes, currentPage]);

  const totalPages = Math.max(1, Math.ceil(myRecipes.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return myRecipes.slice(start, start + perPage);
  }, [myRecipes, currentPage]);

  const handleEdit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/recipeMain/edit/${id}`);
  };

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
        setMyRecipes(prev => prev.filter(recipe => recipe.id !== id));
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
        <>
          <div className="recipe-card-grid">
            {pagedRecipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onClick={(id) => navigate(`/recipeMain/${id}`)}
                footer={
                  <>
                    <button className="recipe-edit-btn" onClick={e => handleEdit(r.id, e)}>수정</button>
                    <button className="recipe-delete-btn" onClick={e => handleDelete(r.id, e)}>삭제</button>
                  </>
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button className="pagination-arrow" disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <div key={page} onClick={() => setCurrentPage(page)}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}>{page}</div>
              ))}
              <button className="pagination-arrow" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>▶</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyPageRecipe;
