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
                  <Nav.Link onClick={() => navigate(`/product/insert`)}>상품 등록</Nav.Link>
                  {/* 관리자는 모든 사람의 주문 내역 확인 */}
                  <Nav.Link onClick={() => navigate(`/order/list`)}>주문 내역</Nav.Link>
                  <Nav.Link onClick={handleLogout}>로그 아웃</Nav.Link>
               </>
            );
         case 'USER':
            return (
               <>
                  <Nav.Link onClick={() => navigate(`/cart/list`)}>장바구니</Nav.Link>
                  <Nav.Link onClick={() => navigate(`/order/list`)}>주문 내역</Nav.Link>
                  <Nav.Link onClick={handleLogout}>로그 아웃</Nav.Link>
               </>
            );
         default:
            return (
               <>
                  <Nav.Link onClick={() => navigate(`/member/login`)}>로그인</Nav.Link>
                  <Nav.Link onClick={() => navigate(`/member/signup`)}>회원 가입</Nav.Link>
               </>
            );
      }
   };

   return (
      <Navbar bg="dark" variant="dark" expand="lg">
         <Container>
          
         </Container>
      </Navbar >
   );
}

export default App;