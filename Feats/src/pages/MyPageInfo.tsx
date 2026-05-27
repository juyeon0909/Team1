import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Container } from 'react-bootstrap';
import "../components/MyPage.css";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import customAxios from './../api/axiosInstance'; // 사용자 정의 axios 인스턴스
import { API_BASE_URL } from "../config/config";

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
                const url = `${API_BASE_URL}/mypage/info`;
                const response = await customAxios.get(url);

                // 서버가 준 진짜 데이터(닉네임, 이미지 등)로 상태 변경!
                // 백엔드가 주는 데이터 구조(예: response.data.name)에 맞게 맞추시면 됩니다.
                setUser({
                    name: response.data.name || '이름 없음',
                    profileimage: response.data.profileimage || null,
                    email: response.data.email || '이메일 정보 없음'
                });

                // 패스워드리스 등록 여부 확인
                const plResponse = await customAxios.get(`${API_BASE_URL}/passwordless/check-status`, {
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

    

    const uploadProfileImage = async (base64Image: string) => {
        // 에러 초기화
        setErrors({ profileimage: '', general: '' });

        try {
            // 백엔드 프로필 이미지 변경 엔드포인트 (실제 API 주소에 맞게 수정 가능)
            const url = '/mypage/update-profileimage';

            // base64 데이터를 담아 서버로 전송
            const response = await customAxios.post(url, { profileimage: base64Image });

            // 성공하면 화면 상태 갱신 및 알림 (서버에서 반환한 URL이 있다면 response.data... 등으로 대체 가능)
            setUser(prev => ({ ...prev, profileimage: base64Image }));
            alert('프로필 사진이 성공적으로 변경되었습니다! ✅');

        } catch (error) {
            console.error('프로필 이미지 업로드 실패:', error);

            if (axios.isAxiosError(error) && error.response) {
                // 백엔드에서 보낸 구체적인 에러 메시지가 있다면 세팅
                setErrors({
                    profileimage: error.response.data?.errors?.profileimage || '',
                    general: error.response.data?.message || '프로필 사진 변경 중 오류가 발생했습니다.'
                });
            } else {
                setErrors(prev => ({ ...prev, general: '서버와의 통신 중 오류가 발생했습니다.' }));
            }
        }
    };

    const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, files } = event.target;

        if (!files || files.length === 0) {
            alert('이미지 파일을 선택해주셔야 합니다');
            return;
        }

        const file = files[0]; // 선택한 첫 번째 파일
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onloadend = () => {
            const result = reader.result as string;

            // 3. 파일 읽기가 끝나면 base64 결과물을 들고 서버 업로드 함수 실행
            uploadProfileImage(result);
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
                            <div className="m-icon">✏️</div>
                            <div className="m-info">
                                <div className="m-lbl">정보 수정</div>
                                <div className="m-sub">닉네임 및 비밀번호 변경</div>
                            </div>
                        </button>
                    
                        {/* 2. 내 레시피 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/recipe')}>
                            <div className="m-icon">🍳</div>
                            <div className="m-info">
                                <div className="m-lbl">내 레시피</div>
                                <div className="m-sub">내가 등록한 레시피 확인</div>
                            </div>
                        </button>

                        {/* 3. 좋아요 내역 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/like')}>
                            <div className="m-icon">❤️</div>
                            <div className="m-info">
                                <div className="m-lbl">좋아요 내역</div>
                                <div className="m-sub">좋아요 누른 레시피 보관함</div>
                            </div>
                        </button>

                        {/* 4. 문의하기 */}
                        <button className="menu-btn" onClick={() => navigate('/mypage/qna')}>
                            <div className="m-icon">💬</div>
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