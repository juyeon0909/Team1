import React, { useState, useEffect } from 'react';
import { Container, Button, Table, Badge, Stack } from 'react-bootstrap';
// 💡 레시피 데이터 양식을 매칭하기 위해 임포트 (경로가 다르면 프로젝트에 맞게 수정해주세요)
import { INITIAL_RECIPES } from "../types/RecipeData";
import type { Recipe } from "../types/RecipeData";
import "../components/MyPage.css";

function App() {
    console.log('자바스크립트 코딩 영역');

    // 'likes' 상태를 추가하여 좋아요 내역 화면으로 전환할 수 있게 합니다.
    const [currentPage, setCurrentPage] = useState('info'); // 'info', 'edit', 'withdraw', 'qna', 'likes'
    const [editTab, setEditTab] = useState('nickname');
    const [profileimage] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string>('김주연');

    // 💡 [추가] 좋아요 한 레시피들을 저장할 상태
    const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);

    // 💡 [추가] 사용자가 'likes' 화면을 켜면 로컬스토리지에서 하트 누른 레시피만 뽑아옵니다.
    useEffect(() => {
        if (currentPage === 'likes') {
            const localData = localStorage.getItem('user_recipes');
            const allRecipes: Recipe[] = localData ? JSON.parse(localData) : INITIAL_RECIPES;
            // 하트(isHearted) 상태가 true인 것만 필터링
            setLikedRecipes(allRecipes.filter(r => r.isHearted === true));
        }
    }, [currentPage]);

    // 💡 [추가] 좋아요 내역에서 하트를 다시 누르면 취소되면서 사라지는 함수
    const handleRemoveLike = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const localData = localStorage.getItem('user_recipes');
        const allRecipes: Recipe[] = localData ? JSON.parse(localData) : INITIAL_RECIPES;

        const updatedRecipes = allRecipes.map(r => {
            if (r.id === id) {
                return { ...r, isHearted: false, heart: r.heart - 1 };
            }
            return r;
        });

        localStorage.setItem('user_recipes', JSON.stringify(updatedRecipes));
        setLikedRecipes(updatedRecipes.filter(r => r.isHearted === true));
    };

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
                                {profileimage ? <img src={profileimage} alt="프로필 사진"/> : (nickname ? nickname.charAt(0) : '?')}
                            </div>
                            <label className="profile-edit-btn" htmlFor="profile-uploader" title="프로필 사진 변경">📸</label>
                            <input type="file" id="profile-uploader" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImageChange} />
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

                        {/* 3. 좋아요 내역 (정상 작동하도록 바인딩 완료) */}
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

            {/* 💡 3. [새로 추가] 좋아요 내역 구현 페이지 ('likes') */}
            {currentPage === 'likes' && (
                <div id="page-likes" className="page active">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Button variant="light" onClick={() => setCurrentPage('info')} style={{ fontSize: '16px' }}>
                            ⬅️ 뒤로가기
                        </Button>
                        <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>
                            마이페이지 › <span style={{ color: 'var(--green)' }}>좋아요 내역 ({likedRecipes.length})</span>
                        </h2>
                    </div>

                    {likedRecipes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 0', background: '#fff', borderRadius: '8px', border: '0.5px solid #eee' }}>
                            <span style={{ fontSize: '40px' }}>🤍</span>
                            <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>좋아요 한 레시피가 없습니다.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                            {likedRecipes.map(r => (
                                <div key={r.id} style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ height: '110px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                                        {r.emoji}
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '4px' }}>{r.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', height: '32px', overflow: 'hidden' }}>{r.desc}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '0.5px solid #eee', fontSize: '12px' }}>
                                            <span style={{ color: '#999' }}>⏱️ {r.time}분</span>
                                            <span onClick={(e) => handleRemoveLike(r.id, e)} style={{ cursor: 'pointer', color: '#E05D5D', fontWeight: 'bold' }}>
                                                ❤️ {r.heart} 취소
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. 문의하기 페이지 ('qna') */}
            {currentPage === 'qna' && (
                <div id="page-qna" className="page active">
                    <h2>문의하기</h2>
                    <p>서비스 이용 중 불편한 점이나 제안 사항을 남겨주세요.</p>
                    <Button variant="secondary" onClick={() => setCurrentPage('info')}>뒤로가기</Button>
                </div>
            )}

            {/* 5. 회원 탈퇴 페이지 ('withdraw') */}
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