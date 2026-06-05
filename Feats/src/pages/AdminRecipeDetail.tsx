import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import '../components/RecipeRegister.css';

interface AdminRecipeDetailData {
    id: number;
    title: string;
    category: string;
    cookingTime: number;
    description: string;
    authorName: string;
    authorEmail: string;
     ingredients: { name: string; quantity: string }[];
    registeredAt: string;
    image?: string;
    cookingMethod?: string;
}

const categoryReverseMap: Record<string, string> = {
    KOR: '한식', YANG: '양식', JAN: '일식', CHN: '중식',
    GAN: '간식', YA: '야식', DIET: '다이어트', RAP: '밀프랩'
};

function AdminRecipeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState<AdminRecipeDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await customAxios.get(`/admin/recipes/${id}`);
                setRecipe(res.data);
            } catch (e) {
                console.error('레시피 불러오기 실패:', e);
                alert('레시피 정보를 불러오지 못했습니다.');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleApprove = async () => {
        if (!window.confirm('이 레시피를 승인하시겠습니까?')) return;
        setSubmitting(true);
        try {
            await customAxios.post(`/admin/recipes/${id}/approve`);
            alert('승인되었습니다.');
            navigate('/admin/recipe');
        } catch {
            alert('오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!window.confirm('이 레시피를 거절하시겠습니까?')) return;
        setSubmitting(true);
        try {
            await customAxios.post(`/admin/recipes/${id}/reject`);
            alert('거절되었습니다.');
            navigate('/admin/recipe');
        } catch {
            alert('오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="register-loading-box">레시피 정보를 불러오는 중...</div>;
    if (!recipe) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1rem' }}>

            <div className="back-link" onClick={() => navigate('/admin/recipe')}>
                ← 목록으로
            </div>

            <div className="register-card">
                <div className="register-card-title">레시피 검토</div>

                {/* 작성자 정보 */}
                <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#475569' }}>
                    👤 {recipe.authorName} ({recipe.authorEmail}) · 등록일 {recipe.registeredAt}
                </div>

                {/* 대표 이미지 */}
                {recipe.image && (
                    <div className="form-group">
                        <label className="form-label">요리 대표 이미지</label>
                        <div className="image-preview-wrapper">
                            <img src={recipe.image} alt="대표 이미지" className="preview-image" />
                        </div>
                    </div>
                )}

                {/* 레시피 이름 */}
                <div className="form-group">
                    <label className="form-label">레시피 이름</label>
                    <input className="form-input" type="text" value={recipe.title} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                </div>

                {/* 카테고리 & 조리시간 */}
                <div className="grid-two-columns">
                    <div>
                        <label className="form-label">카테고리</label>
                        <input className="form-input" type="text" value={categoryReverseMap[recipe.category] || recipe.category} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                    </div>
                    <div>
                        <label className="form-label">조리 시간 (단위 : 분)</label>
                        <input className="form-input" type="text" value={recipe.cookingTime} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                    </div>
                </div>

                {/* 간단 소개 */}
                <div className="form-group">
                    <label className="form-label">간단 소개</label>
                    <input className="form-input" type="text" value={recipe.description || ''} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                </div>

                {/* 필수 재료 */}
                <div className="form-group">
                    <label className="form-label">필수 재료 및 용량</label>
                    {recipe.ingredients.length > 0 ? (
                        recipe.ingredients.map((ing, i) => (
                            <div key={i} className="ingredient-row" style={{ marginBottom: '8px' }}>
                                <input className="form-input" type="text" value={ing.name} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                                <input className="form-input" type="text" value={ing.quantity} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                            </div>
                        ))
                    ) : (
                        <input className="form-input" type="text" value="재료 정보 없음" readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                    )}
                </div>

                {/* 선택 재료 */}
                <div className="form-group">
                    <label className="form-label">선택 재료 <span className="form-sublabel">쉼표로 구분</span></label>
                    <input
                        className="form-input"
                        type="text"
                        value={
                            recipe.description?.match(/\(선택 재료: (.+?)\)$/)?.[1] || ''
                        }
                        readOnly
                        style={{ background: '#f8f8f8', cursor: 'default' }}
                        placeholder="선택 재료 없음"
                    />
                </div>

                

                {/* 조리 방법 */}
                {recipe.cookingMethod && (
                    <div className="form-group">
                        <label className="form-label">조리 방법</label>
                        <textarea className="form-input form-textarea" value={recipe.cookingMethod} readOnly style={{ background: '#f8f8f8', cursor: 'default' }} />
                    </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: '20px 0' }} />

                {/* 버튼 */}
                <div className="action-button-group">
                    <button
                        type="button"
                        className="cancel-action-btn"
                        onClick={() => navigate('/admin/recipe')}
                        disabled={submitting}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleReject}
                        disabled={submitting}
                        style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 500 }}
                    >
                        거절
                    </button>
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={submitting}
                        className="submit-action-btn"
                    >
                        승인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminRecipeDetail;