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
import Delete from '../pages/Delete';
import RecipeRegister from '../pages/RecipeRegister'
import RecipeEdit from '../pages/RecipeEdit'
import FindPassword from '../pages/FindPassword.tsx'
import AdminQna from '../pages/AdminQna';
import PasswordlessWithdrawalPage from '../pages/PasswordlessWithdrawalPage'
import PasswordlessRegisterPage from '../pages/PasswordlessRegisterPage'
import AdminRecipe from '../pages/AdminRecipe';
import IngredientList from "../pages/IngredientList.tsx";
import RecipeDetail from "../pages/RecipeDetail";



interface AppProps {
  user: User | null;
  handleLoginSuccess: (userData: User) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

function App({ user, handleLoginSuccess, setUser }: AppProps) {
  return (
    <Routes>
      <Route path='/member/signup' element={<SignupPage />} />
      <Route path='/member/login' element={<LoginPage onLogin={handleLoginSuccess} />} />
      <Route path='/' element={<MainPage />} />
      <Route path='/product/insert' element={<FridgeMainPage />} />
      <Route path='/product/edit/:id' element={<FridgeEdit />} />
      <Route path='/product/register' element={<FridgeRegister />} />
      <Route path='/ingredient/list' element={<IngredientList />} />
      <Route path='/recipeMain/clip' element={<RecipeMainClip />} />
      <Route path='/recipeMain/register' element={<RecipeRegister />} />
      <Route path='/recipeMain/edit/:id' element={<RecipeEdit />} />
      <Route path='/product/register' element={<FridgeRegister />} />
      <Route path="/recipeMain/:id" element={<RecipeDetail />} />
      <Route path='/recipeMain' element={<RecipeMain user={user} />} />
      <Route path='/mypage/info' element={<MyPageInfo />} />
      <Route path="/mypage/edit" element={<MyPageEdit name={user?.name || "이름 없음"} setName={(newName) => setUser(prev => prev ? { ...prev, name: newName } : null)} triggerToast={(msg) => console.log(msg)} />} />
      <Route path='/mypage/recipe' element={<MyPageRecipe />} />
      <Route path='/mypage/like' element={<MyPageLike />} />
      <Route path='/mypage/qna' element={<MyPageQna />} />
      <Route path='/delete' element={<Delete />} />
      <Route path='/member/find-password' element={<FindPassword />} />
      <Route path='/admin/qna' element={<AdminQna />} />
      <Route path="/member/passwordless-register" element={<PasswordlessRegisterPage />} />
      <Route path="/member/reset-register" element={<PasswordlessWithdrawalPage />} />
      <Route path='/admin/recipe' element={<AdminRecipe />} />

    </Routes>
  );
}
{/* 커밋 체  크  */ }
{/* 커밋 체쿠 나나난  */ }
/*커밋체크*/
export default App;