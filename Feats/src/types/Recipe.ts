// src/types/Recipe.ts

// 재료 공통 인터페이스
export interface IngredientDto {
  name: string;
  quantity: string;
}

// 메인 목록 및 레시피 공통 DTO 인터페이스
export interface RecipeDto {
  id: number;
  title: string;           // 레시피 제목
  dishName: string;        // 요리명
  category: string;        // 카테고리 (예: "KOR")
  cookingTime: number;     // 조리 시간
  description: string;     // 간단 소개
  image: string;           // 요리 사진 URL 또는 경로
  steps: string[];         // 조리 단계 리스트
  mustIngredients: IngredientDto[];   // 필수 재료 리스트
  selectIngredients: IngredientDto[]; // 선택 재료 리스트
  missingIngredients: IngredientDto[]; // 없는 재료 리스트
  likeCount: number;       // 좋아요 수
  scrapCount: number;      // 스크랩 수
  hearted: boolean;        // 로그인 유저의 좋아요 여부
  scrapped: boolean;       // 로그인 유저의 스크랩 여부
}

// 레시피 상세 응답 인터페이스 (RecipeDto와 동일 구조로 대응)
export interface RecipeDetailResponse extends RecipeDto {}

// 카테고리 코드를 한글 명칭으로 변환해주는 디코더 매핑 객체
export const CATEGORY_DECODER: { [key: string]: string } = {
  KOR: "한식",
  YANG: "양식",
  JAN: "일식",
  CHN: "중식",
  GAN: "간식",
  YA: "야식",
  DIET: "다이어트",
  RAP: "밀프랩",
};