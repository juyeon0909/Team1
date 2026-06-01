// src/types/fridge.ts

export type Urgency = "urgent" | "warning" | "normal";

// 냉장고 전체 보관 목록 및 메인 비전용 마스터 재료 인터페이스
export interface Ingredient {
  id: number;
  name: string;
  itemname?: string;       
  quantity: number;
  expirationdate: string;
  expiry?: string;        
  storagetype: string;     
  type?: string;    
  category?: string;
  dDay?: number;
  urgency?: Urgency;
}

// 자동완성 검색 드롭다운 전용 데이터 인터페이스
export interface SearchItem {
  id?: number;
  itemId?: number;
  name?: string;
  itemName?: string;
  category: string;     
  type?: string;        
  itemUnit?: string;
}