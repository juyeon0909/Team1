// 코드 작성
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App';

import 'bootstrap/dist/css/bootstrap.min.css'; // (step01) for 부트 스트랩

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
