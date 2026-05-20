import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Badge, Stack } from 'react-bootstrap';
import "../components/MyPage.css";

function App() {
    console.log('자바스크립트 코딩 영역');

    const [currentPage, setCurrentPage] = useState('info'); // 현재 페이지 ('info', 'edit', 'withdraw', 'logout')
    const [editTab, setEditTab] = useState('nickname'); // 정보수정 내부 탭 ('nickname', 'password')
    const [profileimage] = useState<string | null>(null);

    const [nickname, setNickname] = useState<string>('김주연');

    const handleProfileImageChange = () => {

    }

    return (
        <Container className="py-4">
            {/* 1. 상단 타이틀 및 작은 메뉴 버튼 */}
            
            <div id="page-info" className="page active">
                
                <div className="page-header">
                    
                        <div>
                            <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>마이페이지 <span>›</span>
                                <span className="cur" style={{ color: 'var(--green)' }}> 내 정보</span>

                            </h2>
                        </div>
                    
                </div>
                <div className="mb-4">
                    <h1 className="page-title" style={{ fontWeight: 'bold', margin: 0 }}>
                        안녕하세요, <span></span>님 👋
                    </h1>
                </div>
                <div className="profile">
                    <div className="profile-con">
                        <div className="profile-lg">
                            {profileimage ? <img src={profileimage} alt="프로필 사진"/> : (
                            nickname ? nickname.charAt(0) : '?'
                            )}
                        </div>
                            <label className="profile-edit-btn" htmlFor="profile-uploader" title="프로필 사진 변경">📸</label>
                            <input type="file" id="profile-uploader" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageChange} />
                    </div>
                    <div className="profile-info">
                        <div className="profile-name">김주연</div>
                        <div className="profile-email">kimjuyeon@example.com</div>
                        <span className="profile-hero-badge">일반 회원</span>
                    </div>
                </div>

                <div className="menu-grid">
                    <button className="menu-btn" onClick={() => setCurrentPage("edit")}>
                        <div className="m-icon">✏️</div>
                        <div className="m-info">
                            <div className="m-lbl">정보 수정</div>
                            <div className="m-sub">닉네임 및 비밀번호 변경</div>
                        </div>
                    </button>
                
                    <button className="menu-btn" onClick={() => setCurrentPage("edit")}>
                        <div className="m-icon">🍳</div>
                        <div className="m-info">
                            <div className="m-lbl">내 레시피</div>
                            <div className="m-sub">내가 등록한 레시피 확인</div>
                        </div>
                    </button>

                    <button className="menu-btn" onClick={() => setCurrentPage("edit")}>
                        <div className="m-icon">❤️</div>
                        <div className="m-info">
                            <div className="m-lbl">좋아요 내역</div>
                            <div className="m-sub">좋아요 누른 레시피 보관함</div>
                        </div>
                    </button>

                    <button className="menu-btn" onClick={() => setCurrentPage("edit")}>
                        <div className="m-icon">💬</div>
                        <div className="m-info">
                            <div className="m-lbl">문의하기</div>
                            <div className="m-sub">서비스 이용 불편 및 제안 사항</div>
                        </div>
                    </button>
                </div>

                <div className="withdraw-box">
                    <span className="withdraw-link" onClick={() => setCurrentPage('withdraw')}>회원 탈퇴를 원하시나요?</span>
                </div> 


            </div>
        </Container>


    );
};

export default App;