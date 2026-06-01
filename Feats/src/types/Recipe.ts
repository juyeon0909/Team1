// RecipeMainDto.java 와 1:1 대응하는 타입

export interface IngredientDto {
  itemName: string; // 재료명
  quantity: number; // 수량
  unit: string;     // 단위 (g, ml, 스푼 등)
}

export interface Recipe {
  // ─── 기본 정보 ───
  id: number;
  title: string;         // 레시피 제목
  dishName: string;      // 요리명
  description: string;   // 간단 소개
  image: string;         // 요리 사진 경로
  cookingTime: number;   // 소요 시간 (분)
  cookingMethod: string; // 요리 방법
  category: string;      // 카테고리 (KOR, WEST, JAPAN, CHINA, DIET, SNACK ...)
  approvalStatus: string;// 승인 여부 (PENDING, APPROVED, REJECTED)
  viewCount: number;     // 조회수
  updatedAt: string;     // 업로드 일자 (yyyy-MM-dd)

  // ─── 작성자 정보 ───
  authorName: string;

  // ─── 재료 정보 ───
  mustIngredients: IngredientDto[];   // 필수 재료
  selectIngredients: IngredientDto[]; // 선택 재료

  // ─── 좋아요 / 스크랩 수 ───
  likeCount: number;
  scrapCount: number;

  // ─── 로그인 사용자 기준 상태 ───
  isLiked: boolean;    // 현재 사용자가 좋아요 눌렀는지
  isScrapped: boolean; // 현재 사용자가 스크랩했는지
}