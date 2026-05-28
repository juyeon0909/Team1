import { Col, Form, Row } from "react-bootstrap";
import type { PagingInfo } from "../types/Paging";
import type { SearchCondition } from "../types/SearchCondition";

type Props = {
    searchCondition: SearchCondition;
    setSearchCondition: React.Dispatch<React.SetStateAction<SearchCondition>>;
    paging: PagingInfo;
};

function FieldSearch({ searchCondition, setSearchCondition, paging }: Props) {

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;

        setSearchCondition(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Form className="p-3">
            <Row className="mb-3">

                {/* 기간 */}
                <Col md={2}>
                    <Form.Select
                        name="searchDateType"
                        value={searchCondition.searchDateType}
                        onChange={handleChange}
                    >
                        <option value='all'>전체 기간</option>
                        <option value='1d'>1일</option>
                        <option value='1w'>1주</option>
                        <option value='1m'>1개월</option>
                        <option value='6m'>6개월</option>
                    </Form.Select>
                </Col>

                {/* 카테고리 */}
                <Col md={2}>
                    <Form.Select
                        name="category"
                        value={searchCondition.category}
                        onChange={handleChange}
                    >
                        <option value="ALL">카테고리 선택</option>
                        <option value="BREAD">빵</option>
                        <option value="BEVERAGE">음료수</option>
                        <option value="CAKE">케익</option>
                        <option value="MACARON">마카롱</option>
                    </Form.Select>
                </Col>

                {/* 검색 모드 */}
                <Col md={2}>
                    <Form.Select
                        name="searchMode"
                        value={searchCondition.searchMode}
                        onChange={handleChange}
                    >
                        <option value="ALL">전체 검색</option>
                        <option value="name">상품명</option>
                        <option value="description">상품 설명</option>
                    </Form.Select>
                </Col>

                {/* 검색어 */}
                <Col md={4}>
                    <Form.Control
                        name="searchKeyword"
                        type="text"
                        placeholder="검색어를 입력해 주세요."
                        value={searchCondition.searchKeyword}
                        onChange={handleChange}
                    />
                </Col>

                {/* 상태 */}
                <Col md={2}>
                    <Form.Control
                        type="text"
                        value={paging.pagingStatus}
                        disabled
                    />
                </Col>

            </Row>
        </Form>
    );
}

export default FieldSearch;