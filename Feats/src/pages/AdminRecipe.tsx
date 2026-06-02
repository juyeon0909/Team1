import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import { API_BASE_URL } from '../config/config';
import '../components/MyPageRecipe.css';

interface AdminRecipe {
    id: number;
    title: string;
    category: string;
    cookingTime: number;
    description: string;
    authorName: string;
    authorEmail: string;
    ingredients: string[];
    registeredAt: string;
    image?: string;
}

const categoryLabel: Record<string, string> = {
    KOR: '한식', YANG: '양식', JAN: '일식', CHN: '중식',
    GAN: '간식', YA: '야식', DIET: '다이어트', RAP: '밀프랩'
};

function AdminRecipe() {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await customAxios.get(`${API_BASE_URL}/admin/recipes/pending`);
            setRecipes(res.data || []);
        } catch (e) {
            console.error('목록 불러오기 실패:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    if (loading) return <div className="mypage-loading-box">불러오는 중...</div>;

    return (
        <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
            <h2 style={{ color: '#6FBC44', fontWeight: 'bold', marginBottom: '8px' }}>레시피 승인 관리</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
                승인 대기 중인 레시피를 검토하고 승인 또는 거절합니다.
            </p>

            {recipes.length === 0 ? (
                <div className="empty-recipe-box">
                    승인 대기 중인 레시피가 없습니다.
                </div>
            ) : (
                <div className="recipe-card-grid">
                    {recipes.map(recipe => (
                        <div
                            key={recipe.id}
                            onClick={() => navigate(`/admin/recipes/${recipe.id}`)}
                            className="recipe-item-card"
                        >
                            <div className="recipe-card-image-box">
                                {recipe.image ? (
                                    <img src={recipe.image} alt={recipe.title} className="recipe-card-img" />
                                ) : (
                                    <div className="recipe-card-no-img">🍳</div>
                                )}
                            </div>

                            <div className="recipe-card-content">
                                <span className="recipe-card-category">
                                    {categoryLabel[recipe.category] || recipe.category}
                                </span>
                                <h3 className="recipe-card-title-text">{recipe.title}</h3>
                                <p className="recipe-card-desc-text">{recipe.description}</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                                    {recipe.authorName} · {recipe.registeredAt}
                                </p>
                            </div>

                            <div className="recipe-card-footer">
                                <span style={{
                                    fontSize: '11px', fontWeight: 'bold', color: '#f59e0b',
                                    background: '#fffbeb', padding: '3px 10px', borderRadius: '12px',
                                    border: '0.5px solid #fcd34d'
                                }}>
                                    승인 대기
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Container>
    );
}

export default AdminRecipe;