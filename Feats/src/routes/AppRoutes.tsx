import { Route, Routes } from "react-router-dom";
import SignupPage from './../pages/SignupPage';
import LoginPage from './../pages/LoginPage';
import type { User } from "../types/User";


interface AppProps {
  user: User | null;
  handleLoginSuccess: (userData: User) => void;
}
function App({ user, handleLoginSuccess }: AppProps) {
  return (
    <Routes>
      <Route path='/member/signup' element={<SignupPage />} />

      <Route path='/member/login' element={<LoginPage onLogin={handleLoginSuccess} />} />

    </Routes>
  );
}

export default App;