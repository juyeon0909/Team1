import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import customAxios from './../api/axiosInstance';
import type { AdminQnaItem } from '../types/Admin';

export default function AdminQna() {
    const [qnas, setQnas] = useState<AdminQnaItem[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
    const [filterStatus, setFilterStatus] = useState<'all' | '접수중' | '답변완료'>('all');

    const fetchQnas = async () => {
        try {
            const res = await customAxios.get('/admin/qnas');
            setQnas(res.data || []);
        } catch (e) {
            console.error('Q&A 목록 불러오기 실패:', e);
        }
    };

    useEffect(() => { fetchQnas(); }, []);

    const handleAnswerSubmit = async (id: number) => {
        const answer = answerInputs[id]?.trim();
        if (!answer) { alert('답변 내용을 입력해 주세요.'); return; }
        try {
            await customAxios.post(`/admin/qnas/${id}/answer`, { answer });
            alert('답변이 등록되었습니다.');
            await fetchQnas();
            setExpandedId(null);
        } catch {
            alert('오류가 발생했습니다.');
        }
    };

    const filtered = qnas.filter(q => filterStatus === 'all' || q.status === filterStatus);

    return (
        <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
            <h2 style={{ color: '#6abf69', fontWeight: 'bold', marginBottom: '8px' }}>문의 관리</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>회원들의 문의를 확인하고 답변을 등록합니다.</p>

            {/* 상태 필터 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['all', '접수중', '답변완료'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{
                        padding: '6px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px',
                        background: filterStatus === s ? '#6abf69' : '#f8fafc',
                        color: filterStatus === s ? '#fff' : '#64748b',
                        fontWeight: filterStatus === s ? 'bold' : 'normal'
                    }}>
                        {s === 'all' ? `전체 (${qnas.length})` : `${s} (${qnas.filter(q => q.status === s).length})`}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>문의가 없습니다.</div>
                ) : filtered.map(qna => (
                    <div key={qna.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div onClick={() => setExpandedId(expandedId === qna.id ? null : qna.id)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#64748b' }}>{qna.qnaType}</span>
                                <div>
                                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{qna.title}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{qna.memberName} ({qna.memberEmail})</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{qna.createdAt}</span>
                                <span style={{
                                    fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px',
                                    color: qna.status === '답변완료' ? '#6abf69' : '#f59e0b',
                                    background: qna.status === '답변완료' ? '#f0fdf4' : '#fffbeb'
                                }}>{qna.status}</span>
                                <span style={{ fontSize: '12px' }}>{expandedId === qna.id ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {expandedId === qna.id && (
                            <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>문의 내용</div>
                                    <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{qna.content}</div>
                                </div>
                                <div style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                                        {qna.answer ? '등록된 답변 (수정 가능)' : '답변 작성'}
                                    </div>
                                    <textarea rows={4} placeholder="답변 내용을 입력해 주세요."
                                        value={answerInputs[qna.id] ?? (qna.answer || '')}
                                        onChange={e => setAnswerInputs(prev => ({ ...prev, [qna.id]: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical' }}
                                    />
                                    <button onClick={() => handleAnswerSubmit(qna.id)} style={{
                                        marginTop: '10px', padding: '8px 20px', background: '#6abf69',
                                        color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                                    }}>
                                        {qna.answer ? '답변 수정' : '답변 등록'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Container>
    );
}