// src/types/Admin.ts
// Q&A 관련

export interface AdminQnaItem {
  id: number;
  memberName: string;
  memberEmail: string;
  qnaType: string;
  title: string;
  content: string;
  status: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

// 레시피 승인 목록

export interface AdminRecipe {
  id: number;
  title: string;
  category: string;
  cookingTime: number;
  description: string;
  authorName: string;
  authorEmail: string;
  ingredients: string[];
  registeredAt: string;
  image?: string;
}

// 레시피 승인 상세

export interface AdminRecipeDetailData {
  id: number;
  title: string;
  category: string;
  cookingTime: number;
  description: string;
  authorName: string;
  authorEmail: string;
  ingredients: { name: string; quantity: string }[];
  selectIngredients?: { name: string; quantity: number }[];
  registeredAt: string;
  image?: string;
  cookingMethod?: string;
}
