import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import customAxios from './../api/axiosInstance';
import { API_BASE_URL } from '../config/config';

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
}

function AdminRecipe() {
    const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
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

    const handleApprove = async (id: number) => {
        try {
            await customAxios.post(`${API_BASE_URL}/admin/recipes/${id}/approve`);
            alert('승인되었습니다.');
            await fetchPending();
            setExpandedId(null);
        } catch { alert('오류가 발생했습니다.'); }
    };

    const handleReject = async (id: number) => {
        if (!window.confirm('정말 거절하시겠습니까?')) return;
        try {
            await customAxios.post(`${API_BASE_URL}/admin/recipes/${id}/reject`);
            alert('거절되었습니다.');
            await fetchPending();
            setExpandedId(null);
        } catch { alert('오류가 발생했습니다.'); }
    };

    return (
        <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
            <h2 style={{ color: '#6FBC44', fontWeight: 'bold', marginBottom: '8px' }}>레시피 승인 관리</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
                승인 대기 중인 레시피를 검토하고 승인 또는 거절합니다.
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>불러오는 중...</div>
            ) : recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}></div>
                    <div style={{ fontWeight: 'bold', color: '#475569' }}>승인 대기 중인 레시피가 없습니다</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recipes.map(recipe => (
                        <div key={recipe.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                            {/* 헤더 */}
                            <div
                                onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#fff' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '12px', background: '#E8F5DA', padding: '2px 8px', borderRadius: '4px', color: '#3E8C1F' }}>
                                        {recipe.category}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{recipe.title}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                            {recipe.authorName} ({recipe.authorEmail})
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{recipe.registeredAt}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: '12px' }}>
                                        승인 대기
                                    </span>
                                    <span style={{ fontSize: '12px' }}>{expandedId === recipe.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* 상세 내용 */}
                            {expandedId === recipe.id && (
                                <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                                            <span>⏱️ {recipe.cookingTime}분</span>
                                            <span>📂 {recipe.category}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>소개</div>
                                        <div style={{ fontSize: '14px', color: '#1e293b', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                            {recipe.description || '설명 없음'}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>재료</div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {recipe.ingredients.map((ing, i) => (
                                                <span key={i} style={{ fontSize: '12px', background: '#fff', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {ing}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px 20px', display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleApprove(recipe.id)}
                                            style={{ padding: '8px 24px', background: '#6FBC44', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                             승인
                                        </button>
                                        <button
                                            onClick={() => handleReject(recipe.id)}
                                            style={{ padding: '8px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                             거절
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Container>
    );
}
export default AdminRecipe;