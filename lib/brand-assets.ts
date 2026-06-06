export interface BrandProductVisual {
  id: string;
  name: string;
  category: string;
  image: string;
  hoverImage: string;
}

export interface BrandProductSeed extends BrandProductVisual {
  price: number;
  segment: 'customizada' | 'base';
  shortReason: string;
  stylingTip: string;
}

export interface BrandJournalArticle {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
}

export const BRAND_EDITORIAL_ASSETS = {
  heroLeft: '/assets/products/mockups/camiseta-regular/preto-presenca/mockup-camiseta-regular-preto-presenca-front.png',
  heroCenter: '/assets/editorial/hero-center-canvas.svg',
  heroRight: '/assets/editorial/hero-manifesto-square.svg',
  megaMenuCard: '/assets/products/mockups/moletom-unissex/offwhite-oracao/mockup-moletom-unissex-offwhite-oracao-front.png',
  aboutHero: '/assets/editorial/about-hero-manifesto.svg',
  aboutArt: '/assets/editorial/about-art-studio.svg',
  aboutCommunity: '/assets/editorial/about-community-circle.svg',
  editorialAtelier: '/assets/editorial/editorial-atelier.svg',
  journalFeature: '/assets/editorial/journal-feature-ruah.svg',
  journalArticle: '/assets/editorial/journal-article-ruah.svg',
} as const;

export const BRAND_PRODUCT_SEEDS: BrandProductSeed[] = [
  {
    id: '1',
    name: 'Camiseta Oração',
    category: 'Autoral',
    image: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.png',
    hoverImage: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-left-3q.png',
    price: 89.9,
    segment: 'customizada',
    shortReason: 'Boa para quem quer presença tranquila e leitura mais contemplativa.',
    stylingTip: 'Combine com base neutra e deixe a mensagem da peça conduzir o visual.',
  },
  {
    id: '2',
    name: 'Moletom Presença',
    category: 'Campanha',
    image: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-left-3q.png',
    price: 159.9,
    segment: 'customizada',
    shortReason: 'Entrega conforto visual e mais peso para encontros, retiros e clima noturno.',
    stylingTip: 'Funciona melhor como peça central, com contraste entre preto, areia e off-white.',
  },
  {
    id: '3',
    name: 'Ecobag Reino',
    category: 'Acessórios',
    image: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-front.png',
    hoverImage: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-left-3q.png',
    price: 45,
    segment: 'customizada',
    shortReason: 'Resolve presente, rotina e uso leve sem perder linguagem de marca.',
    stylingTip: 'Use com camisa lisa e acessórios discretos para manter a leitura limpa.',
  },
  {
    id: '4',
    name: 'Boné Presença',
    category: 'Artistas',
    image: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-left-3q.png',
    price: 95,
    segment: 'customizada',
    shortReason: 'Ajuda quando a pessoa quer afirmar identidade sem depender de estampa grande.',
    stylingTip: 'Funciona melhor com camadas neutras e silhueta mais seca.',
  },
  {
    id: '5',
    name: 'Camiseta Serena',
    category: 'Autoral',
    image: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-front.png',
    hoverImage: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-left-3q.png',
    price: 65,
    segment: 'base',
    shortReason: 'É a escolha mais versátil para quem precisa de suavidade e uso recorrente.',
    stylingTip: 'Ganhe elegância com tons crus, jeans limpo e poucos elementos concorrendo.',
  },
  {
    id: '6',
    name: 'Ecobag Presença',
    category: 'Acessórios',
    image: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-left-3q.png',
    price: 35,
    segment: 'base',
    shortReason: 'É um ponto de entrada simples para começar pela mensagem e utilidade.',
    stylingTip: 'Use como acento escuro em composições mais claras para equilibrar o conjunto.',
  },
];

export const BRAND_PRODUCT_VISUALS: BrandProductVisual[] = BRAND_PRODUCT_SEEDS.map(
  ({ id, name, category, image, hoverImage }) => ({ id, name, category, image, hoverImage })
);

const PRODUCT_VISUAL_BY_ID = Object.fromEntries(
  BRAND_PRODUCT_VISUALS.map((item) => [item.id, item])
) as Record<string, BrandProductVisual>;

const PRODUCT_SEED_BY_ID = Object.fromEntries(
  BRAND_PRODUCT_SEEDS.map((item) => [item.id, item])
) as Record<string, BrandProductSeed>;

export function getBrandProductVisual(productId: string) {
  return PRODUCT_VISUAL_BY_ID[productId] ?? BRAND_PRODUCT_VISUALS[0];
}

export function getBrandProductSeed(productId: string) {
  return PRODUCT_SEED_BY_ID[productId] ?? BRAND_PRODUCT_SEEDS[0];
}

export const BRAND_SEARCH_BANNERS = [
  {
    title: 'Best Sellers',
    tag: 'Destaques',
    image: '/assets/editorial/search-banner-bestsellers.svg',
  },
  {
    title: 'Nova Série: Respiro',
    tag: 'Sopro Novo',
    image: '/assets/editorial/search-banner-respiro.svg',
  },
] as const;

export const BRAND_JOURNAL_ARTICLES: BrandJournalArticle[] = [
  {
    id: 1,
    title: 'Quando a peça carrega mensagem sem perder forma.',
    excerpt: 'O melhor editorial da marca não grita. Ele organiza cor, matéria e silêncio para deixar a fé aparecer com nitidez.',
    category: 'Manifesto',
    author: 'Equipe UseRuah',
    date: '06 Jun 2026',
    readTime: '4 min',
    image: BRAND_EDITORIAL_ASSETS.journalFeature,
  },
  {
    id: 2,
    title: 'Curadoria não é enfeite. É direção de marca.',
    excerpt: 'Escolha de mockup, textura, recorte e ritmo visual decide se a loja parece coleção ou catálogo genérico.',
    category: 'Direção Criativa',
    author: 'Atelier Ruah',
    date: '02 Jun 2026',
    readTime: '3 min',
    image: BRAND_EDITORIAL_ASSETS.journalArticle,
  },
  {
    id: 3,
    title: 'Uma marca cristã contemporânea precisa fugir do literal fácil.',
    excerpt: 'A tensão certa está em traduzir convicção em atmosfera, não em repetir símbolos sem intenção.',
    category: 'Identidade',
    author: 'Studio Ruah',
    date: '29 Mai 2026',
    readTime: '5 min',
    image: BRAND_EDITORIAL_ASSETS.editorialAtelier,
  },
];
