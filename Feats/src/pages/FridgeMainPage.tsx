import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Table, Badge, Stack } from 'react-bootstrap';

const FridgeMainPage = () => {
  const navigate = useNavigate();

  // 예시 데이터 (실제로는 API나 부모 컴포넌트에서 받아온 데이터를 사용하게 됩니다)
  const dummyIngredients = [
    { id: 1, name: "우유", quantity: "1L", expiry: "2026-05-20", category: "유제품" },
    { id: 2, name: "계란", quantity: "10알", expiry: "2026-05-25", category: "신선식품" },
    { id: 3, name: "닭가슴살", quantity: "500g", expiry: "2026-05-15", category: "육류" },
  ];

  return (
    <Container className="py-4">
      {/* 1. 상단 타이틀 및 작은 메뉴 버튼 */}
      <div className="d-flex justify-content-between align-items-end mb-4 pb-2 border-bottom">
        <div>
          <h2 style={{ color: '#1a5d3b', fontWeight: 'bold', margin: 0 }}>내 냉장고 보관함</h2>
          <p className="text-muted mb-0 small">현재 보관 중인 재료 리스트입니다.</p>
        </div>
        
        {/* 수정과 등록을 작게 배치 */}
        <Stack direction="horizontal" gap={2}>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => navigate('/product/edit')}
            style={{ fontSize: '0.85rem' }}
          >
            ✏️ 정보 수정
          </Button>
          <Button 
            variant="success" 
            size="sm" 
            onClick={() => navigate('/product/register')}
            style={{ backgroundColor: '#1a5d3b', border: 'none', fontSize: '0.85rem' }}
          >
            ➕ 새 재료 등록
          </Button>
        </Stack>
      </div>

      {/* 2. 메인 보관함 목록 (Table 형태) */}
      <div className="bg-white p-3 rounded shadow-sm">
        <Table hover responsive>
          <thead className="table-light">
            <tr>
              <th>카테고리</th>
              <th>재료명</th>
              <th>수량</th>
              <th>유통기한</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {dummyIngredients.map((item) => (
              <tr key={item.id} style={{ cursor: 'pointer' }}>
                <td><Badge bg="secondary">{item.category}</Badge></td>
                <td><strong>{item.name}</strong></td>
                <td>{item.quantity}</td>
                <td>{item.expiry}</td>
                <td>
                  <Badge bg="success">신선</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {dummyIngredients.length === 0 && (
          <div className="text-center py-5 text-muted">
            냉장고가 비어있습니다. 새로운 재료를 등록해 보세요!
          </div>
        )}
      </div>
    </Container>
  );
};

export default FridgeMainPage;