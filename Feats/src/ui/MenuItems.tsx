import "../components/MenuItems.css";
import { NavDropdown, Navbar, Container, Nav } from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import type { User } from "../types/User";

/* ============================================================
   타입 정의
   - 원본 HTML에 하드코딩돼 있던 값들을 타입으로 정리.
   - 추후 Spring Boot API 응답을 이 타입에 맞춰 매핑하면 됨.
   ============================================================ */

type MenuItemsProps = {
   appName: string;
   user: User | null; // 이 데이터는 null일 수도 있습니다.
   handleLogout: (event: React.MouseEvent<HTMLElement>) => void;
};

function App({ appName, user, handleLogout }: MenuItemsProps) {
   console.log('xxx 프롭스 : ' + appName);
   const navigate = useNavigate();
   const USER_NAME = "김주연";
   const NAV_USER_LABEL = "김주";

   // user 프롭스를 사용하여 상단에 보이는 풀다운 메뉴를 적절히 분기 처리합니다.
   const Navbar: React.FC = () => {
      switch (user?.role) {
         case 'ADMIN':
            return (
               <>
                  <Nav className="nav-links">
                     <Nav.Link onClick={() => navigate(`/`)} className="active">
                        홈
                     </Nav.Link>
                     <NavDropdown title={`레시피`}>
                        <NavDropdown.Item onClick={() => navigate(`/recipeMain`)}>전체 레시피</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => navigate(`/recipeMain/register`)}>레시피 등록</NavDropdown.Item>
                     </NavDropdown>

                  </Nav>
                  <NavDropdown className="nav-user" title={NAV_USER_LABEL}>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/info`)}>내 정보</NavDropdown.Item>
                     <NavDropdown.Item onClick={handleLogout}>로그아웃</NavDropdown.Item>
                  </NavDropdown>
               </>
            );
         case 'USER':
            return (
               <>
                  <Nav className="nav-links">
                     <Nav.Link onClick={() => navigate(`/`)} className="active">
                        홈
                     </Nav.Link>
                     <Nav.Link onClick={() => navigate(`/product/insert`)}>냉장고</Nav.Link>

                     <NavDropdown title={`레시피`}>
                        <NavDropdown.Item onClick={() => navigate(`/recipeMain`)}>전체 레시피</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => navigate(`/recipeMain/register`)}>레시피 등록</NavDropdown.Item>
                     </NavDropdown>

                     <Nav.Link onClick={() => navigate(`/recipeMain/clip`)}>스크랩</Nav.Link>

                  </Nav>
                  <NavDropdown className="nav-user" title={NAV_USER_LABEL}>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/info`)}>내 정보</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/recipe`)}>내 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/fruit/like`)}>좋아요</NavDropdown.Item>
                     <NavDropdown.Item onClick={handleLogout}>로그아웃</NavDropdown.Item>
                  </NavDropdown>
               </>
            );
         default:
            return (
               <>
                  <Nav className="nav-links">
                     <Nav.Link onClick={() => navigate(`/`)} className="active">
                        홈
                     </Nav.Link>
                     <Nav.Link onClick={() => navigate(`/product/insert`)}>냉장고</Nav.Link>
                     <Nav.Link onClick={() => navigate(`/recipeMain`)}>
                        레시피
                     </Nav.Link>
                     <Nav.Link onClick={() => navigate(`/member/login`)}>로그인</Nav.Link>
                  </Nav>
                  
               </>
            );
      }
   };

   return (
      <Container fluid className="imf-nav me-auto">
         <div className="nav-logo" onClick={() => navigate(`/`)} style={{ cursor: "pointer" }}>
            <span className="carrot">🥕</span>
            <span className="nav-logo-text">잇츠 인 마이 냉장고</span>
         </div>
         <Navbar />
      </Container>
   );
}

export default App;