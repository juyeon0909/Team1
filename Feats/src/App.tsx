import './App.css';

import MyPageLike from './pages/MyPageLike';
import MenuItems from './ui/MenuItems';
import AppRoutes from './routes/AppRoutes';
import AlertModal from './ui/AlertModal';
import React, { useEffect, useState } from 'react';
import type { User } from './types/User';
import { useNavigate, useLocation } from 'react-router-dom';

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loginUser = localStorage.getItem('user');

    // 타입을 확인하는 함수
    if (typeof loginUser === 'string') {
      const parsed = JSON.parse(loginUser);
      setUser(parsed);
    }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
useEffect(() => {
    if (!location) return; // location 객체가 아직 준비 안 되었을 때를 위한 방어 코드 (빨간줄 방지!)
    
    const currentPath = location.pathname;

    switch (currentPath) {
      case '/':
      case '/product/list':
        document.title = "냉장고를 지켜줘";
        break;
      case '/product/register':
        document.title = "재료 등록 - 냉장고를 지켜줘";
        break;
      case '/product/insert':
        document.title = "보관함 - 냉장고를 지켜줘";
        break;
      case '/member/login':
        document.title = "로그인 - 냉장고를 지켜줘";
        break;
      case '/member/signup':
        document.title = "회원가입 - 냉장고를 지켜줘";
        break;
        
      case '/recipeMain':
        document.title = "레시피 - 냉장고를 지켜줘";
        break;
        
      case '/recipeMain/register':
        document.title = "레시피 등록 - 냉장고를 지켜줘";
        break;
        
    }
  }, [location]);
  
const hideNav = ['/member/login', '/member/signup'].includes(location.pathname);

  // 로그인 성공시 처리해야 할 동작을 명시하는 함수
  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  

 const handleLogout = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    console.log('로그 아웃 성공');
    navigate('/member/login');
  };

  return (
    <>
      <AlertModal />
      {!hideNav && <MenuItems user={user} handleLogout={handleLogout} />}
      <AppRoutes user={user} handleLoginSuccess={handleLoginSuccess} setUser={setUser} />

      <footer className="bg-dark text-light text-center py-3 mt-5">
      </footer>
    </>
  );
}

export default App;