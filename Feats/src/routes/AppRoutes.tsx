import { Route, Routes } from "react-router-dom";
import SignupPage from './../pages/SignupPage';
import LoginPage from './../pages/LoginPage';
import MainPage from './../pages/mainPage';
import type { User } from "../types/User";
import FridgeMainPage from './../pages/FridgeMainPage';
import FridgeEdit from './../pages/FridgeEdit';
import FridgeRegister from './../pages/FridgeRegister';
import RecipeMain from '../pages/recipeMain';
import RecipeMainClip from '../pages/recipeMainClip';
import MyPageInfo from '../pages/MyPageInfo';
import MyPageRecipe from '../pages/MyPageRecipe';
import MyPageLike from '../pages/MyPageLike';
import Logout from '../pages/Logout';


interface AppProps {
  user: User | null;
  handleLoginSuccess: (userData: User) => void;
}
function App({ user, handleLoginSuccess }: AppProps) {
  return (
    <Routes>
      <Route path='/member/signup' element={<SignupPage />} />
      <Route path='/member/login' element={<LoginPage onLogin={handleLoginSuccess} />} />
      <Route path='/' element={<MainPage/>}/>
      <Route path='/product/insert' element={<FridgeMainPage />} />
      <Route path='/product/edit' element={<FridgeEdit />} />
      <Route path='/product/register' element={<FridgeRegister />} />
      <Route path='/recipeMain' element={<RecipeMain />} />
      <Route path='/recipeMain/clip' element={<RecipeMainClip />} />
      <Route path='/mypage/info' element={<MyPageInfo />} />
      <Route path='/mypage/recipe' element={<MyPageRecipe />} />
      <Route path='/fruit/like' element={<MyPageLike />} />
      <Route path='/logout' element={<Logout />} />
    </Routes>
  );
}


export default App;