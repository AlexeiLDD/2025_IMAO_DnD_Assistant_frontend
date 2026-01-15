export type SearchParams = {
  value: string;
  exact: boolean;
};

export type OrderParams = {
  field: string;
  direction: 'asc' | 'desc';
};

export type FilterParams = {
  book: string[];
  npc: string[];
  challengeRating: string[];
  type: string[];
  size: string[];
  tag: string[];
  moving: string[];
  senses: string[];
  vulnerabilityDamage: string[];
  resistanceDamage: string[];
  immunityDamage: string[];
  immunityCondition: string[];
  features: string[];
  environment: string[];
};

export type GetCreaturesRequest = {
  start: number;
  size: number;
  search: SearchParams;
  order: OrderParams[];
  filter: FilterParams;
};
