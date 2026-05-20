// src/recipeData.ts

// 1. 이 구조(타입)는 DB가 들어와도 안 바뀝니다. (그대로 유지)
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
  star: number;
  urgent: boolean;
  isScrapped?: boolean;
  isHearted?: boolean;
}

// 2. [임시 데이터] 나중에 DB 연동 완료되면 이 배열은 통째로 지울 겁니다.
export const INITIAL_RECIPES: Recipe[] = [
  { id: 1, name: '두부 계란찜', cat: '한식', time: 15, match: 100, emoji: '🍳', bg: '#E1F5EE', desc: '부드러운 두부와 계란의 초간단 한식 반찬', tags: ['초간단', '15분'], heart: 234, star: 4.8, urgent: true, isScrapped: false, isHearted: false },
  { id: 2, name: '대파 된장찌개', cat: '한식', time: 20, match: 85, emoji: '🥘', bg: '#FAEEDA', desc: '구수한 된장과 신선한 대파의 조화', tags: ['국물', '20분'], heart: 189, star: 4.6, urgent: true, isScrapped: false, isHearted: false },
  { id: 3, name: '애호박 볶음밥', cat: '한식', time: 10, match: 70, emoji: '🍜', bg: '#EAF3DE', desc: '냉장고 속 애호박을 활용한 간편 볶음밥', tags: ['간편식', '10분'], heart: 412, star: 4.7, urgent: true, isScrapped: false, isHearted: false },
  { id: 4, name: '치즈 오믈렛', cat: '양식', time: 10, match: 85, emoji: '🧀', bg: '#FCEBEB', desc: '촉촉하고 부드러운 프렌치 스타일 오믈렛', tags: ['양식', '10분'], heart: 305, star: 4.9, urgent: false, isScrapped: false, isHearted: false },
  { id: 5, name: '된장 비빔밥', cat: '한식', time: 15, match: 70, emoji: '🍚', bg: '#FBEAF0', desc: '각종 나물과 된장으로 만드는 영양 비빔밥', tags: ['한식', '15분'], heart: 98, star: 4.4, urgent: false, isScrapped: false, isHearted: false },
  { id: 6, name: '계란국', cat: '한식', time: 10, match: 100, emoji: '🍲', bg: '#E6F1FB', desc: '간단하게 뚝딱 만드는 따뜻한 계란국', tags: ['국물', '10분'], heart: 156, star: 4.5, urgent: true, isScrapped: false, isHearted: false },
  { id: 7, name: '파스타', cat: '양식', time: 20, match: 60, emoji: '🍝', bg: '#E1F5EE', desc: '집에서 즐기는 토마토 파스타', tags: ['양식', '20분'], heart: 280, star: 4.7, urgent: false, isScrapped: false, isHearted: false },
  { id: 8, name: '두부 스테이크', cat: '양식', time: 15, match: 85, emoji: '🥩', bg: '#FAEEDA', desc: '두부으로 만드는 든든한 채식 스테이크', tags: ['양식', '15분'], heart: 210, star: 4.6, urgent: true, isScrapped: false, isHearted: false },
  { id: 9, name: '냉파 볶음', cat: '한식', time: 10, match: 100, emoji: '🥬', bg: '#EAF3DE', desc: '냉장고 파 털어 만드는 쫄깃한 볶음', tags: ['간편', '10분'], heart: 88, star: 4.3, urgent: true, isScrapped: false, isHearted: false },
];

/**
 * 3. [미래 대비용 함수] 데이터를 가져오는 통로를 미리 파둡니다.
 * 지금은 로컬스토리지나 임시 배열을 주지만, 나중에 DB가 생기면 이 내부만 수술할 겁니다.
 */
export const getRecipes = (): Recipe[] => {
  const localData = localStorage.getItem('user_recipes');
  if (localData) {
    return JSON.parse(localData);
  }
  // 로컬스토리지에도 없으면 임시 초깃값을 브라우저에 구워주고 리턴합니다.
  localStorage.setItem('user_recipes', JSON.stringify(INITIAL_RECIPES));
  return INITIAL_RECIPES;
};


// src/recipeData.ts 맨 밑에 추가

/**
 * [미래 대비용] 데이터베이스에서 레시피 목록을 가져오는 함수 (지금은 가짜)
 */
export const fetchRecipes = async (): Promise<Recipe[]> => {
  // 나중에 DB가 생기면 아래 코드로 바뀔 자리입니다:
  // const response = await axios.get('/api/recipes');
  // return response.data;

  // 당장은 데이터베이스가 없으므로 로컬 데이터를 0.5초 뒤에 주는 것처럼 시뮬레이션합니다.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(INITIAL_RECIPES);
    }, 500);
  });
};


