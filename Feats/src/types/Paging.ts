// Step01. 페이징과 검색 조건 타입
// 페이징 정보 (백엔드 Page 객체 대응)
export type PagingInfo = {
    totalElements: number; // 전체 데이터 개수
    pageSize: number;      // 페이지당 데이터 수
    totalPages: number;    // 전체 페이지 수
    pageNumber: number;    // 현재 페이지 번호 (0-based)
    pageCount: number;     // 하단 페이지 버튼 개수
    beginPage: number;     // 시작 페이지 번호
    endPage: number;       // 끝 페이지 번호
    pagingStatus: string;  // "1 / 10 페이지"
};


// Step02. 초기 값 정의
export const initialPagingInfo: PagingInfo = {
    totalElements: 0,
    pageSize: 6,
    totalPages: 0,
    pageNumber: 0,
    pageCount: 10,
    beginPage: 0,
    endPage: 0,
    pagingStatus: ''
};
