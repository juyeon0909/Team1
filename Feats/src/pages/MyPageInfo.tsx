import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap';
import "../components/MyPage.css";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import customAxios from './../api/axiosInstance'; // 사용자 정의 axios 인스턴스

function App() {
    console.log('자바스크립트 코딩 영역');
    const navigate = useNavigate();

    const [user, setUser] = useState({
    name: '',
    profileimage: null as string | null,
    email: ''
    });

    const [errors, setErrors] = useState({
        profileimage: '',
        general: ''
    });
    const [isPasswordless, setIsPasswordless] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                // 백엔드의 내 정보 조회 API 엔드포인트
                const response = await customAxios.get('/mypage/info');

                // 서버가 준 진짜 데이터(닉네임, 이미지 등)로 상태 변경!
                // 백엔드가 주는 데이터 구조(예: response.data.name)에 맞게 맞추시면 됩니다.
                setUser({
                    name: response.data.name || '이름 없음',
                    profileimage: response.data.profileimage || null,
                    email: response.data.email || '이메일 정보 없음'
                });

                // 패스워드리스 등록 여부 확인
                const plResponse = await customAxios.get('/passwordless/check-status', {
                    params: { email: response.data.email }
                });
                setIsPasswordless(plResponse.data === true);

            } catch (error) {
                console.error('유저 정보 불러오기 실패:', error);
                setErrors(prev => ({ ...prev, general: '회원 정보를 불러오지 못했습니다.' }));
            }
        };

        fetchUserInfo();

        
    }, []);

    

// uploadProfileImage: File → base64 String으로 되돌리기
const uploadProfileImage = async (base64Image: string) => {
    setErrors({ profileimage: '', general: '' });
    try {
        const response = await customAxios.post('/mypage/update-profileimage', {
            profileimage: base64Image
        });
        // 서버가 S3 URL 반환 → 화면에 반영
        setUser(prev => ({ ...prev, profileimage: response.data }));
        alert('프로필 사진이 성공적으로 변경되었습니다! ✅');
    } catch (error) {
        console.error('프로필 이미지 업로드 실패:', error);
        setErrors(prev => ({ ...prev, general: '프로필 사진 변경 중 오류가 발생했습니다.' }));
    }
};

// handleProfileImageChange: 원래대로 base64 변환 후 전송
const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
        alert('이미지 파일을 선택해주셔야 합니다');
        return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        uploadProfileImage(reader.result as string);
    };
};

    return (
        <Container className="py-4">
            {/* 1. 내 정보 페이지 ('info') 일 때만 렌더링 */}

                <div id="page-info" className="page active">
                    
                    <div className="page-header">
                        <div>
                            <h2 style={{ color: '#6abf69', fontWeight: 'bold', margin: 0 }}>
                                <span className="cur" style={{ color: 'var(--green)' }}> 내 정보</span>
                            </h2>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h1 className="page-title" style={{ fontWeight: 'bold', margin: 0 }}>
                            안녕하세요, <span>{user.name}</span>님
                        </h1>
                    </div>

                    <div className="profile">
                        <div className="profile-container">
                            <div className="profile-lg">
                                {user.profileimage ? (
                                    <img src={user.profileimage} alt="프로필 사진"/>
                                ) : (
                                    user.name ? user.name.charAt(0) : '?'
                                )}
                            </div>
                            <label className="profile-edit-btn" htmlFor="profile-uploader" title="프로필 사진 변경">📸</label>
                            <input 
                                type="file" 
                                id="profile-uploader"
                                name="profileimage"
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleProfileImageChange} 
                            />
                        </div>
                        <div className="profile-info">
                            <div className="profile-name">{user.name}</div>
                            <div className="profile-email">{user.email || '이메일 정보 없음'}</div>
                            <div className="profile-passwordless">{isPasswordless
                                ? '패스워드리스 등록된 사용자입니다'
                                : '패스워드리스 미등록'}
                            </div>
                            <span className="profile-hero-badge">일반 회원</span>
                        </div>
                    </div>

                    <div className="menu-grid">
                        {/* 1. 정보 수정 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/edit')}>
                            <div className="m-info">
                                <div className="m-lbl">정보 수정</div>
                                <div className="m-sub">닉네임 및 비밀번호 변경</div>
                            </div>
                        </button>
                    
                        {/* 2. 내 레시피 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/recipe')}>
                            <div className="m-info">
                                <div className="m-lbl">내 레시피</div>
                                <div className="m-sub">내가 등록한 레시피 확인</div>
                            </div>
                        </button>

                        {/* 3. 좋아요 내역 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/like')}>
                            <div className="m-info">
                                <div className="m-lbl">좋아요 내역</div>
                                <div className="m-sub">좋아요 누른 레시피 보관함</div>
                            </div>
                        </button>

                        {/* 4. 문의하기 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/qna')}>
                            <div className="m-info">
                                <div className="m-lbl">문의하기</div>
                                <div className="m-sub">서비스 이용 불편 및 제안 사항</div>
                            </div>
                        </button>
                    </div>

                    {/* 요청하신 코드로 변경 및 부모(info) 안쪽 제자리 배치 완료 */}
                    {/* navigate 경로 수정 */}
                    <div className="withdraw-box">
                        <span className="withdraw-link" onClick={() => navigate('/delete')}>회원 탈퇴를 원하시나요?</span>
                    </div> 
                </div>

            
        </Container>
    );
}
{/* 커밋 체크 */}
export default App;