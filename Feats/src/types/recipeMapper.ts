// src/utils/recipeMapper.ts — DTO를 화면 타입으로 변환 (한 곳에서만)
import { type RecipeDto, type RecipeView, CATEGORY_DECODER } from './Recipe';

export const toRecipeView = (dto: RecipeDto): RecipeView => {
  const category = CATEGORY_DECODER[dto.category] ?? dto.category ?? '한식';
  return {
    id: dto.id,
    title: dto.title,
    category,
    categoryCode: dto.category,
    time: dto.cookingTime,
    match: undefined,
    emoji: '🍳',
    bg: '#E1F5EE',
    desc: dto.description,
    tags: [category, `${dto.cookingTime}분`],
    heart: dto.likeCount ?? 0,
    scrap: dto.scrapCount ?? 0,
    viewCount: dto.viewCount ?? 0,
    urgent: dto.urgent ?? false,
    isHearted: dto.hearted ?? false,
    isScrapped: dto.scrapped ?? false,
    image: dto.image ?? '',
    mustIngredients: dto.mustIngredients ?? [],
    steps: dto.steps ?? [],
    selectIngredients: dto.selectIngredients ?? [],
    missingIngredients: dto.missingIngredients ?? [],
    author: dto.author ?? '',
    scrappedAt: dto.scrappedAt ?? '',
  };
};