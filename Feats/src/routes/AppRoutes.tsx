import { Route, Routes } from "react-router-dom";
import SignupPage from './../pages/SignupPage';
import LoginPage from './../pages/LoginPage';
import MainPage from './../pages/mainPage';
import type { User } from "../types/User";
import FridgeMainPage from './../pages/FridgeMainPage';
import FridgeEdit from './../pages/FridgeEdit';
import FridgeRegister from './../pages/FridgeRegister';
import RecipeMain from '../pages/RecipeMain';
import RecipeMainClip from '../pages/RecipeMainClip';
import MyPageInfo from '../pages/MyPageInfo';
import MyPageEdit from '../pages/MyPageEdit';
import MyPageRecipe from '../pages/MyPageRecipe';
import MyPageLike from '../pages/MyPageLike';
import MyPageQna from '../pages/MyPageQna';
import Logout from '../pages/Logout';
import Delete from '../pages/Delete';
import RecipeRegister from '../pages/RecipeRegister'
import RecipeEdit from '../pages/RecipeEdit'
import FindPassword from '../pages/FindPassword.tsx'



interface AppProps {
  user: User | null;
  handleLoginSuccess: (userData: User) => void;
}
function App({ user, handleLoginSuccess }: AppProps) {
  return (
    <Routes>
      <Route path='/member/signup' element={<SignupPage />} />
      <Route path='/member/login' element={<LoginPage onLogin={handleLoginSuccess} />} />
      <Route path='/' element={<MainPage />} />
      <Route path='/product/insert' element={<FridgeMainPage />} />
      <Route path='/product/edit' element={<FridgeEdit />} />
      <Route path='/product/register' element={<FridgeRegister />} />
      <Route path='/recipeMain/clip' element={<RecipeMainClip />} />
      <Route path='/recipeMain' element={<RecipeMain />} />
      <Route path='/recipeMain/register' element={<RecipeRegister />} />
      <Route path='/mypage/info' element={<MyPageInfo />} />
      <Route path="/mypage/edit" element={<MyPageEdit nickname="홍길동" triggerToast={(msg) => console.log(msg)} />} />
      <Route path='/mypage/recipe' element={<MyPageRecipe />} />
      <Route path='/mypage/like' element={<MyPageLike />} />
      <Route path='/mypage/qna' element={<MyPageQna />} />
      <Route path='/logout' element={<Logout />} />
      <Route path='/delete' element={<Delete />} />
      <Route path='/recipeMain/edit' element={<RecipeEdit />} />
      <Route path='/member/find-password' element={<FindPassword />} />

    </Routes>
  );
}

{/* 커밋 체쿠  */ }
export default App;