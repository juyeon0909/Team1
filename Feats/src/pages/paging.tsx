import { Pagination } from "react-bootstrap";
import type { PagingInfo } from "../types/Paging";
import type React from "react";
type Props = {
    paging: PagingInfo,
    setPaging: React.Dispatch<React.SetStateAction<PagingInfo>>
}

function App({paging, setPaging} : Props) {
    console.log('자바스크립트 코딩 영역');

    return (
        // 페이징을 가운데로 오게 하기
        <Pagination className="justify-content-center mt-4">
            <Pagination.First // 이전 값 중에서 나머지 값은 전개시키고 pageNumber만 교체하기
                onClick={() => setPaging((prev) => ({ ...prev, pageNumber: 0 }))}
                // 선택 못하게 만들기 (버튼 비활성화)
                // 맨처음은 처음 하단 페이지 버튼의 갯수보다 현재 페이지숫자가 크면 눌러도 됨
                // disabled={true} 이면 비활성화하게 됨
                disabled={paging.pageNumber < paging.pageCount}
            >
                맨처음
            </Pagination.First>

            <Pagination.Prev
                onClick={() => {
                    const gotoPage = paging.beginPage - 1;
                    setPaging(prev => ({ ...prev, pageNumber: gotoPage }));
                }}
                disabled={paging.pageNumber < paging.pageCount}
            >
                이전
            </Pagination.Prev>

            {/* ...은 전개 연산자 */}
            {/* 밑에 배열은 원소 10개짜리 배열임 */}
            {/* 무슨말인지 몰라서 다시 공부해야함 */}
            {/* 꼭 알아야 하는 부분 / 중요!!! */}
            {[...Array(paging.endPage - paging.beginPage + 1)].map((_, idx) => {
                const pageIndex = paging.beginPage + idx + 1;

                return (
                    <Pagination.Item
                        key={pageIndex}
                        active={paging.pageNumber === (pageIndex - 1)}
                        onClick={() =>
                            setPaging(prev => ({
                                ...prev,
                                pageNumber: pageIndex - 1
                            }))
                        }
                    >
                        {pageIndex}
                    </Pagination.Item>
                );
            })}

            <Pagination.Next
                onClick={() => {
                    const gotoPage = paging.endPage + 1;
                    setPaging(prev => ({ ...prev, pageNumber: gotoPage }));
                }} // 수학 공식을 모아놓은 기본 객체인 Math 객체를 이용함
                disabled={paging.pageNumber >= Math.floor(paging.totalPages / paging.pageCount)
                    * paging.pageCount}
            >
                다음
            </Pagination.Next>

            <Pagination.Last
                onClick={() => {
                    const gotoPage = paging.totalPages - 1;
                    setPaging(prev => ({ ...prev, pageNumber: gotoPage }));
                }} // 수학 공식을 모아놓은 기본 객체인 Math 객체를 이용함
                disabled={paging.pageNumber >= Math.floor(paging.totalPages / paging.pageCount)
                    * paging.pageCount}
            >
                맨끝
            </Pagination.Last>

        </Pagination>
    );
};

export default App;