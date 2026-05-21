export type ShopSegment = 'All' | 'Base' | 'Customizada';
export type ShopCategory = 'All' | 'Autoral' | 'Campanhas' | 'Fardamento' | 'Acessórios';

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  category: Exclude<ShopCategory, 'All'>;
  segment: Exclude<ShopSegment, 'All'>;
  image: string;
  tags: string[];
}

export interface ShopSegmentOption {
  id: ShopSegment;
  label: string;
  detail: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = ['All', 'Autoral', 'Campanhas', 'Fardamento', 'Acessórios'];

export const SHOP_SEGMENTS: ShopSegmentOption[] = [
  { id: 'All', label: 'Todos os Chamados', detail: 'Exploração completa' },
  { id: 'Base', label: 'Linha Base', detail: 'Foco em Volume e Recorrência' },
  { id: 'Customizada', label: 'Coleção Autoral', detail: 'Personalização e Design' },
];
