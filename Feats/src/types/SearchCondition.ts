// 검색 조건 (SearchDto 대응)
export type SearchCondition = {
    searchDateType: string; // 기간 검색 (문자열)
    category: string;       // 카테고리 (문자열)
    searchMode: string;     // name | description (문자열)
    searchKeyword: string;  // 키워드 (문자열)
};


export const initialSearchCondition: SearchCondition = {
    searchDateType: 'all', 
    category: '',
    searchMode: '',
    searchKeyword: ''
};