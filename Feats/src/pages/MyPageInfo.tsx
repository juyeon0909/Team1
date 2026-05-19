import React, { useState } from 'react';
import { Container, Button, Table, Badge, Stack } from 'react-bootstrap';

function App() {
    console.log('자바스크립트 코딩 영역');

    const [currentPage, setCurrentPage] = useState('info'); // 현재 페이지 ('info', 'edit', 'withdraw', 'logout')
    const [editTab, setEditTab] = useState('nickname'); // 정보수정 내부 탭 ('nickname', 'password')

    return (
        <Container className="py-4">
            {/* 1. 상단 타이틀 및 작은 메뉴 버튼 */}
            <div id="page-info" className="page active">
                <div className="page-header">
                    <div className="d-flex justify-content-between align-items-end mb-4 pb-2 border-bottom">
                        <div>
                            <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>마이페이지 <span>›</span>
                                <span className="cur"> 내 정보</span>

                            </h2>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className='page-title' style={{ fontWeight: 'bold', margin: 0 }}>안녕하세요,</h2>
                </div>
                내 정보
                /* 내 정보 확인
                   내 정보 수정
                   - 프로필 사진 등록(수정?)
                   - 비밀번호 수정 
                   - 닉네임 수정
                   - 회원 탈퇴 */

                <div className="info-grid">
                    <div className="info-item">
                        <div className="label">닉네임</div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body">
                        <div className="quick-menu">
                            <button className="quick-btn danger" onClick={() => setCurrentPage('withdraw')}>
                                <div className="q-icon red">⚠️</div>
                                <span className="q-label">회원 탈퇴</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </Container>


    );
};

export default App;