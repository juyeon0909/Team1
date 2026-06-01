export interface Recipe {
  id: number;
  name: string;
  cat: string;
  time: number;
  match: number;
  emoji: string;
  bg: string;
  desc: string;
  tags: string[];
  heart: number;
  scrap: number;
  urgent: boolean;
  isHearted?: boolean;
  isScrapped?: boolean;
  mustIngredients: { name: string; quantity: string }[];
  selectIngredients: string[];
  missingIngredients: string[];
  steps: string[];
}

export const CATEGORY_DECODER: { [key: string]: string } = {
  KOR: '한식', YANG: '양식', JAN: '일식', CHN: '중식',
  GAN: '간식', YA: '야식', DIET: '다이어트', RAP: '밀프랩',
};

export const getMatchBadgeClass = (match: number): string => {
  if (match >= 100) return 'badge-match-full';
  if (match >= 80)  return 'badge-match-high';
  return 'badge-match-mid';
};
