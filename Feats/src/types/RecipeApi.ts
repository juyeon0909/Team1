import axiosInstance from "../api/axiosInstance";
import type { RecipeDto, RecipeDetailResponse } from "./Recipe";

// Fetches all approved recipes
export const fetchAllRecipes = async (): Promise<RecipeDto[]> => {
  // 백엔드 컨트롤러가 /api/recipeMain으로 매핑되어 있으므로 주소를 맞춥니다.
  const response = await axiosInstance.get<RecipeDto[]>('/recipeMain');
  return response.data;
};

// Fetches a single recipe by ID for detail view
export const fetchRecipeDetail = async (id: string): Promise<RecipeDetailResponse> => {
  // 백엔드 상세 조회 엔드포인트에 맞춰 수정이 필요할 수 있습니다. 
  // 현재 컨트롤러엔 상세조회가 없으므로 필요시 백엔드에 추가해야 합니다.
  const response = await axiosInstance.get<RecipeDetailResponse>(`/recipeMain/${id}`);
  return response.data;
};

export const toggleLike = async (id: number): Promise<void> => {
  // 백엔드 좋아요 엔드포인트 주소에 맞춰 수정이 필요할 수 있습니다.
  await axiosInstance.post(`/recipeMain/${id}/like`);
};

export const toggleScrap = async (id: number): Promise<void> => {
  // 백엔드 스크랩 엔드포인트 주소에 맞춰 수정이 필요할 수 있습니다.
  await axiosInstance.post(`/recipeMain/${id}/clip`);
};