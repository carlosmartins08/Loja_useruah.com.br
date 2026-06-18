export type ShopSegment = 'All' | 'Base' | 'Customizada';
export type ShopCategory = 'All' | 'Autoral' | 'Campanhas' | 'Fardamento' | 'Acessórios';

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  category: Exclude<ShopCategory, 'All'>;
  segment: Exclude<ShopSegment, 'All'>;
  image: string;
  hoverImage?: string;
  badge?: string;
  tags: string[];
  variantId: string;
  variantLabel: string;
  pricingPolicyMinPrice?: number;
}

export interface ShopSegmentOption {
  id: ShopSegment;
  label: string;
  detail: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = ['All', 'Autoral', 'Campanhas', 'Fardamento', 'Acessórios'];

export const SHOP_SEGMENTS: ShopSegmentOption[] = [
  { id: 'All', label: 'Todos os recortes', detail: 'Exploração completa do catálogo' },
  { id: 'Base', label: 'Linha Base', detail: 'Peças de recorrência e entrada' },
  { id: 'Customizada', label: 'Coleção Autoral', detail: 'Leitura curada e direção visual' },
];
