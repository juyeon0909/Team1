import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Badge, Stack } from 'react-bootstrap';
import "../components/MyPage.css";

function App() {
    console.log('자바스크립트 코딩 영역');

    const [currentPage, setCurrentPage] = useState('info'); // 현재 페이지 ('info', 'edit', 'withdraw', 'qna')
    const [editTab, setEditTab] = useState('nickname'); // 정보수정 내부 탭 ('nickname', 'password')
    const [profileimage] = useState<string | null>(null);

    const [nickname, setNickname] = useState<string>('김주연');

    const handleProfileImageChange = () => {
        // 프로필 이미지 변경 로직
    };

    return (
        <Container className="py-4">
            {/* 1. 내 정보 페이지 ('info') 일 때만 렌더링 */}
            {currentPage === 'info' && (
                <div id="page-info" className="page active">
                    
                    <div className="page-header">
                        <div>
                            <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>
                                마이페이지 <span>›</span>
                                <span className="cur" style={{ color: 'var(--green)' }}> 내 정보</span>
                            </h2>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h1 className="page-title" style={{ fontWeight: 'bold', margin: 0 }}>
                            안녕하세요, <span>{nickname}</span>님 👋
                        </h1>
                    </div>

                    <div className="profile">
                        <div className="profile-container">
                            <div className="profile-lg">
                                {profileimage ? (
                                    <img src={profileimage} alt="프로필 사진"/>
                                ) : (
                                    nickname ? nickname.charAt(0) : '?'
                                )}
                            </div>
                            <label className="profile-edit-btn" htmlFor="profile-uploader" title="프로필 사진 변경">📸</label>
                            <input 
                                type="file" 
                                id="profile-uploader" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleProfileImageChange} 
                            />
                        </div>
                        <div className="profile-info">
                            <div className="profile-name">{nickname}</div>
                            <div className="profile-email">kimjuyeon@example.com</div>
                            <span className="profile-hero-badge">일반 회원</span>
                        </div>
                    </div>

                    <div className="menu-grid">
                        {/* 1. 정보 수정 */}
                        <button className="menu-btn" onClick={() => setCurrentPage("edit")}>
                            <div className="m-icon">✏️</div>
                            <div className="m-info">
                                <div className="m-lbl">정보 수정</div>
                                <div className="m-sub">닉네임 및 비밀번호 변경</div>
                            </div>
                        </button>
                    
                        {/* 2. 내 레시피 */}
                        <button className="menu-btn" onClick={() => setCurrentPage("my-recipes")}>
                            <div className="m-icon">🍳</div>
                            <div className="m-info">
                                <div className="m-lbl">내 레시피</div>
                                <div className="m-sub">내가 등록한 레시피 확인</div>
                            </div>
                        </button>

                        {/* 3. 좋아요 내역 */}
                        <button className="menu-btn" onClick={() => setCurrentPage("likes")}>
                            <div className="m-icon">❤️</div>
                            <div className="m-info">
                                <div className="m-lbl">좋아요 내역</div>
                                <div className="m-sub">좋아요 누른 레시피 보관함</div>
                            </div>
                        </button>

                        {/* 4. 문의하기 */}
                        <button className="menu-btn" onClick={() => setCurrentPage("qna")}>
                            <div className="m-icon">💬</div>
                            <div className="m-info">
                                <div className="m-lbl">문의하기</div>
                                <div className="m-sub">서비스 이용 불편 및 제안 사항</div>
                            </div>
                        </button>
                    </div>

                    {/* 요청하신 코드로 변경 및 부모(info) 안쪽 제자리 배치 완료 */}
                    <div className="withdraw-box">
                        <span className="withdraw-link" onClick={() => setCurrentPage('withdraw')}>회원 탈퇴를 원하시나요?</span>
                    </div> 
                </div>
            )}

            {/* 2. 정보 수정 페이지 ('edit') */}
            {currentPage === 'edit' && (
                <div id="page-edit" className="page active">
                    <h2>정보 수정 페이지</h2>
                    <p>여기에 닉네임 및 비밀번호 변경 폼을 작성하세요.</p>
                    <Button variant="secondary" onClick={() => setCurrentPage('info')}>뒤로가기</Button>
                </div>
            )}

            {/* 3. 문의하기 페이지 ('qna') */}
            {currentPage === 'qna' && (
                <div id="page-qna" className="page active">
                    <h2>문의하기</h2>
                    <p>서비스 이용 중 불편한 점이나 제안 사항을 남겨주세요.</p>
                    <Button variant="secondary" onClick={() => setCurrentPage('info')}>뒤로가기</Button>
                </div>
            )}

            {/* 4. 회원 탈퇴 페이지 ('withdraw') */}
            {currentPage === 'withdraw' && (
                <div id="page-withdraw" className="page active">
                    <h2>회원 탈퇴</h2>
                    <p>정말로 탈퇴하시겠습니까? 작성하신 레시피와 모든 정보가 삭제됩니다.</p>
                    <Stack direction="horizontal" gap={2}>
                        <Button variant="danger">탈퇴하기</Button>
                        <Button variant="secondary" onClick={() => setCurrentPage('info')}>취소</Button>
                    </Stack>
                </div>
            )}
            
        </Container>
    );
}

export default App;