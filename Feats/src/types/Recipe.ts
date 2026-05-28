export interface Recipe {
  id: string;
  name: string;
  cat: string;
  time: number;
  desc: string;
  tags: string[];
  image: string;
}