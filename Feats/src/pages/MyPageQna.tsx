import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import customAxios from './../api/axiosInstance';
import { API_BASE_URL } from '../config/config';
import '../components/MyPage.css'; // 여기에 상단에 정의한 CSS 스타일을 넣어두시면 편리합니다.

export default function InquiryPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        inquiryType: '',
        title: '',
        content: ''
    });

    const handleChange = (e : React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            // customAxios 및 API_BASE_URL 상수를 활용한 통신 처리 예시
            const response = await customAxios.post(`${API_BASE_URL}/api/inquiries`, formData);
            if (response.status === 200 || response.status === 201) {
                alert('문의가 성공적으로 접수되었습니다.');
                navigate('/mypage'); // 마이페이지 등으로 이동
            }
        } catch (error) {
            console.error('문의 등록 실패:', error);
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <Container style={{ paddingTop: '50px', paddingBottom: '50px' }}>
            {/* 네비게이션 브레드크럼 */}
            <div className="page-header" style={{ marginBottom: '20px' }}>
            <div className="breadcrumb" style={{ display: 'flex', gap: '6px', fontSize: '13px', marginBottom: '8px' }}>
                <span className="link" style={{ cursor: 'pointer', color: '#888' }} onClick={() => navigate('/mypage/info')}>
                    내 정보
                </span>
                <span style={{ color: '#ccc' }}>›</span>
                <span className="cur" style={{ color: '#6abf69', fontWeight: 'bold' }}>좋아요 내역</span>
            </div>
            </div>
            <div className="inquiry-card">
                <h2 className="inquiry-title">1:1 문의하기</h2>
                <p className="inquiry-subtitle">서비스 이용 중 불편한 점이나 궁금한 점을 남겨주시면 친절히 답변해 드리겠습니다.</p>

                <div className="notice-box">
                    • 문의하신 내용은 마이페이지 내 <strong>'문의 내역'</strong>에서 확인하실 수 있습니다.<br />
                    • 영업일 기준 평균 24시간 이내에 답변을 등록해 드립니다.
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="inquiryType" className="form-label">문의 유형</label>
                        <select className="form-select" id="inquiryType" value={formData.inquiryType} onChange={handleChange} required>
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
                        <textarea className="form-control" id="content" rows={6} placeholder="자세한 문의 내용을 작성해 주세요." value={formData.content} onChange={handleChange} required></textarea>
                    </div>

                    <Row className="g-3">
                        <Col xs={6}>
                            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>취소</button>
                        </Col>
                        <Col xs={6}>
                            <button type="submit" className="btn-submit">문의 등록하기</button>
                        </Col>
                    </Row>
                </form>
            </div>
        </Container>
    );
}