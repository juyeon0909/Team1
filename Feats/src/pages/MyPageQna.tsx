import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import { API_BASE_URL } from '../config/config';
import '../components/MyPage.css';

interface Inquiry {
    id: number;
    qnaType: string;
    title: string;
    content: string;
    status: string;
    answer: string | null;
    createdAt: string;
    answeredAt: string | null;
}

export default function MyPageQna() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'history' | 'form'>('history');
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ qnaType: '', title: '', content: '' });

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await customAxios.get(`${API_BASE_URL}/mypage/qna`);
            setInquiries(res.data || []);
        } catch (e) {
            console.error('문의 내역 불러오기 실패:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInquiries(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await customAxios.post(`${API_BASE_URL}/mypage/qna`, formData);
            alert('문의가 접수되었습니다.');
            setFormData({ qnaType: '', title: '', content: '' });
            await fetchInquiries();
            setActiveTab('history');
        } catch {
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        }
    };

    const STATUS_STYLE = (status: string) => ({
        color: status === '답변완료' ? '#6abf69' : '#f59e0b',
        background: status === '답변완료' ? '#f0fdf4' : '#fffbeb',
        padding: '2px 8px', borderRadius: '12px',
        fontSize: '12px', fontWeight: 'bold' as const
    });

    return (
        <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
            <div style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '20px' }}>
                <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>내 정보</span>
                <span style={{ color: '#ccc' }}>›</span>
                <span style={{ color: '#6abf69', fontWeight: 'bold' }}>1:1 문의</span>
            </div>

            <h2 style={{ color: '#6abf69', fontWeight: 'bold', marginBottom: '24px' }}>1:1 문의</h2>

            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
                {(['history', 'form'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: '14px', fontWeight: activeTab === tab ? 'bold' : 'normal',
                        color: activeTab === tab ? '#6abf69' : '#64748b',
                        borderBottom: activeTab === tab ? '2px solid #6abf69' : '2px solid transparent',
                        marginBottom: '-2px'
                    }}>
                        {tab === 'history' ? '내 문의 내역' : '문의하기'}
                    </button>
                ))}
            </div>

            {/* 내 문의 내역 탭 */}
            {activeTab === 'history' && (
                loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>불러오는 중...</div>
                ) : inquiries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                        <div style={{ fontWeight: 'bold', color: '#475569', marginBottom: '16px' }}>문의 내역이 없습니다</div>
                        <button onClick={() => setActiveTab('form')} style={{
                            padding: '8px 20px', background: '#6abf69', color: '#fff',
                            border: 'none', borderRadius: '6px', cursor: 'pointer'
                        }}>문의하기</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {inquiries.map(inq => (
                            <div key={inq.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#fff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#64748b' }}>{inq.qnaType}</span>
                                        <span style={{ fontWeight: 500, color: '#1e293b' }}>{inq.title}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{inq.createdAt}</span>
                                        <span style={STATUS_STYLE(inq.status)}>{inq.status}</span>
                                        <span style={{ fontSize: '12px' }}>{expandedId === inq.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>
                                {expandedId === inq.id && (
                                    <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>문의 내용</div>
                                            <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{inq.content}</div>
                                        </div>
                                        <div style={{ padding: '16px 20px' }}>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>관리자 답변</div>
                                            {inq.answer
                                                ? <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{inq.answer}</div>
                                                : <div style={{ fontSize: '14px', color: '#94a3b8' }}>아직 답변이 등록되지 않았습니다.</div>
                                            }
                                            {inq.answeredAt && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>답변일: {inq.answeredAt}</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* 문의하기 탭 */}
            {activeTab === 'form' && (
                <div className="inquiry-card">
                    <p className="inquiry-subtitle">서비스 이용 중 불편한 점이나 궁금한 점을 남겨주시면 친절히 답변해 드리겠습니다.</p>
                    <div className="notice-box">
                        • 문의하신 내용은 <strong>'내 문의 내역'</strong> 탭에서 확인하실 수 있습니다.<br />
                        • 영업일 기준 평균 24시간 이내에 답변을 등록해 드립니다.
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            //커밋 쳌쳌
                            <label htmlFor="qnaType" className="form-label">문의 유형</label>
                            <select className="form-select" id="qnaType" value={formData.qnaType} onChange={handleChange} required>
                                <option value="" disabled>유형을 선택해 주세요</option>
                                <option value="SERVICE">서비스 이용 문의</option>
                                <option value="ERROR">오류 및 버그 신고</option>
                                <option value="SUGGESTION">건의 및 제안</option>
                                <option value="ETC">기타 문의</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="title" className="form-label">제목</label>
                            <input type="text" className="form-control" id="title" placeholder="제목을 입력해 주세요" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="content" className="form-label">내용</label>
                            <textarea className="form-control" id="content" rows={6} placeholder="자세한 문의 내용을 작성해 주세요." value={formData.content} onChange={handleChange} required />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" className="btn-cancel" style={{ flex: 1 }} onClick={() => setActiveTab('history')}>취소</button>
                            <button type="submit" className="btn-submit" style={{ flex: 1 }}>문의 등록하기</button>
                        </div>
                    </form>
                </div>
            )}
        </Container>
    );
}