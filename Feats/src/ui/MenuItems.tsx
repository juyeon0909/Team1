import { NavDropdown, Navbar, Container, Nav } from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import type { User } from "../types/User";

type MenuItemsProps = {
   appName: string;
   user: User | null; // 이 데이터는 null일 수도 있습니다.
   handleLogout: (event: React.MouseEvent<HTMLElement>) => void;
};

function App({ appName, user, handleLogout }: MenuItemsProps) {
   console.log('xxx 프롭스 : ' + appName);
   const navigate = useNavigate();

   // user 프롭스를 사용하여 상단에 보이는 풀다운 메뉴를 적절히 분기 처리합니다.
   const renderMenu = () => {
      switch (user?.role) {
         case 'ADMIN':
            return (
               <>
                  <Nav.Link onClick={() => navigate(`/product/insert`)}>냉장고</Nav.Link>
                  {/* 관리자는 모든 사람의 주문 내역 확인 */}
                  <NavDropdown title={`레시피북`}>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain`)}>전체 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain/clip`)}>스크랩 목록</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain/register`)}>레시피 등록</NavDropdown.Item>
                  </NavDropdown>
                  
                  <NavDropdown title={`김주연님`}>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/info`)}>내 정보</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/recipe`)}>내 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/fruit/like`)}>좋아요</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/delete`)}>회원 탈퇴</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/logout`)}>로그아웃</NavDropdown.Item>
                  </NavDropdown>
               </>
            );
         case 'USER':
            return (
               <>
                   <Nav.Link onClick={() => navigate(`/product/insert`)}>냉장고</Nav.Link>
                  {/* 관리자는 모든 사람의 주문 내역 확인 */}
                  <NavDropdown title={`레시피북`}>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain`)}>전체 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain/clip`)}>스크랩 목록</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain/register`)}>레시피 등록</NavDropdown.Item>
                  </NavDropdown>
                  
                  <NavDropdown title={`김주연님`}>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/info`)}>내 정보</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/recipe`)}>내 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/fruit/like`)}>좋아요</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/delete`)}>회원 탈퇴</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/logout`)}>로그아웃</NavDropdown.Item>
                  </NavDropdown>
               </>
            );
         default:
            return (
               <>
                <Nav.Link onClick={() => navigate(`/product/insert`)}>냉장고</Nav.Link>
                  {/* 관리자는 모든 사람의 주문 내역 확인 */}
                  <NavDropdown title={`레시피북`}>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain`)}>전체 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain/clip`)}>스크랩 목록</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/recipeMain/register`)}>레시피 등록</NavDropdown.Item>
                  </NavDropdown>
                  
                  <NavDropdown title={`김주연님`}>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/info`)}>내 정보</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/mypage/recipe`)}>내 레시피</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/fruit/like`)}>좋아요</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/delete`)}>회원 탈퇴</NavDropdown.Item>
                     <NavDropdown.Item onClick={() => navigate(`/logout`)}>로그아웃</NavDropdown.Item>
                     
                  </NavDropdown>
                  <Nav.Link onClick={() => navigate(`/member/login`)}>로그인</Nav.Link>
               </>
            );
      }
   };

   return (
      <Navbar style={{ backgroundColor: '#0cc282' }} variant="dark" expand="lg">
         <Container>
           <Nav className="me-auto" style={{ color: 'white' }}>
               {/* 하이퍼링크 : Nav.Link는 다른 페이지로 이동할 때 사용됩니다.  */}
               <Nav.Link onClick={() => navigate(`/`)} style={{ color: 'white' }} >잇츠 인 마이 냉장고</Nav.Link>

               {renderMenu()}

               
            </Nav>
         </Container>
      </Navbar >
   );
}

export default App;