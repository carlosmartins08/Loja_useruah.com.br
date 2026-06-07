export type BrandCatalogCategory = 'Autoral' | 'Campanhas' | 'Acessórios' | 'Fardamento';

export interface BrandMediaItem {
  label: string;
  src: string;
}

export interface BrandPackagingOption {
  name: string;
  description: string;
}

export interface BrandProductVisual {
  id: string;
  name: string;
  category: string;
  image: string;
  hoverImage: string;
}

export interface BrandProductCard extends BrandProductVisual {
  price: number;
  badge?: string;
}

export interface BrandProductSeed extends BrandProductVisual {
  price: number;
  segment: 'customizada' | 'base';
  catalogCategory: BrandCatalogCategory;
  shortReason: string;
  stylingTip: string;
  promptDescriptor: string;
  colorImages: Record<string, string>;
  detailImages: BrandMediaItem[];
  modelMockups: BrandMediaItem[];
  fit: 'slim' | 'regular' | 'oversized';
  fabric: string;
  printTypeDescription: string;
  washGuide: string;
  installmentCount: number;
  productionDays: number;
  sizeOptions: string[];
  printOptions: string[];
  packagingOptions: BrandPackagingOption[];
  tags: string[];
}

export interface BrandCategoryCard {
  name: string;
  image: string;
  link: string;
}

export interface BrandSearchSuggestion {
  id: string;
  name: string;
  category: string;
  reason: string;
}

export interface BrandBootstrapSeed {
  id: string;
  name: string;
  price: number;
  image: string;
  catalogCategory: BrandCatalogCategory;
  segment: 'customizada' | 'base';
  productBaseId: string;
  colorImages: Record<string, string>;
  detailImages: BrandMediaItem[];
  modelMockups: BrandMediaItem[];
  fit: 'slim' | 'regular' | 'oversized';
  fabric: string;
  printTypeDescription: string;
  washGuide: string;
  installmentCount: number;
  productionDays: number;
  sizeOptions: string[];
  printOptions: string[];
  packagingOptions: BrandPackagingOption[];
  tags: string[];
}

export interface BrandProductMerchandising {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage: string;
  category: BrandCatalogCategory;
  segment: 'Base' | 'Customizada';
  tags: string[];
  colorImages: Record<string, string>;
  detailImages: BrandMediaItem[];
  modelMockups: BrandMediaItem[];
  fit: 'slim' | 'regular' | 'oversized';
  fabric: string;
  printTypeDescription: string;
  washGuide: string;
  installmentCount: number;
  productionDays: number;
  sizeOptions: string[];
  printOptions: string[];
  packagingOptions: BrandPackagingOption[];
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
  heroLeft: toEditorialCatalogAssetPath('/assets/products/mockups/camiseta-regular/preto-presenca/mockup-camiseta-regular-preto-presenca-front.png'),
  heroCenter: '/assets/editorial/hero-center-canvas.svg',
  heroRight: '/assets/editorial/hero-manifesto-square.svg',
  megaMenuCard: toEditorialCatalogAssetPath('/assets/products/mockups/moletom-unissex/offwhite-oracao/mockup-moletom-unissex-offwhite-oracao-front.png'),
  aboutHero: '/assets/editorial/about-hero-manifesto.svg',
  aboutArt: '/assets/editorial/about-art-studio.svg',
  aboutCommunity: '/assets/editorial/about-community-circle.svg',
  editorialAtelier: '/assets/editorial/editorial-atelier.svg',
  journalFeature: '/assets/editorial/journal-feature-ruah.svg',
  journalArticle: '/assets/editorial/journal-article-ruah.svg',
} as const;

const RAW_BRAND_PRODUCT_SEEDS: BrandProductSeed[] = [
  {
    id: '1',
    name: 'Camiseta Oração',
    category: 'Autoral',
    catalogCategory: 'Autoral',
    image: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.png',
    hoverImage: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-left-3q.png',
    price: 89.9,
    segment: 'customizada',
    shortReason: 'Boa para quem quer presença tranquila e leitura mais contemplativa.',
    stylingTip: 'Combine com base neutra e deixe a mensagem da peça conduzir o visual.',
    promptDescriptor: 'algodão, leitura contemplativa, editorial',
    colorImages: {
      'Off White': '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.png',
    },
    detailImages: [
      { label: 'Gola', src: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-detail-gola.png' },
      { label: 'Manga', src: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-detail-manga.png' },
      { label: 'Tecido', src: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-detail-tecido.png' },
    ],
    modelMockups: [
      { label: 'Costas', src: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-back.png' },
      { label: 'Lateral', src: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-side.png' },
      { label: 'Ângulo direito', src: '/assets/products/mockups/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-right-3q.png' },
    ],
    fit: 'regular',
    fabric: '100% algodão penteado premium, toque macio e estrutura leve.',
    printTypeDescription: 'Serigrafia premium com acabamento fosco para leitura limpa e durável.',
    washGuide: 'Lavar do avesso em água fria, sem alvejante, e secar à sombra.',
    installmentCount: 3,
    productionDays: 7,
    sizeOptions: ['P', 'M', 'G', 'GG'],
    printOptions: ['Serigrafia premium', 'Digital DTG'],
    packagingOptions: [
      { name: 'Pack Oração', description: 'Envelope premium com proteção essencial e leitura minimalista.' },
      { name: 'Gift Experience', description: 'Caixa rígida com cartão autoral para presente.' },
    ],
    tags: ['Oração', 'Autoral'],
  },
  {
    id: '2',
    name: 'Moletom Presença',
    category: 'Campanha',
    catalogCategory: 'Campanhas',
    image: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-left-3q.png',
    price: 159.9,
    segment: 'customizada',
    shortReason: 'Entrega conforto visual e mais peso para encontros, retiros e clima noturno.',
    stylingTip: 'Funciona melhor como peça central, com contraste entre preto, areia e off-white.',
    promptDescriptor: 'conforto, densidade visual, encontro',
    colorImages: {
      'Preto Ruah': '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-front.png',
    },
    detailImages: [
      { label: 'Gola', src: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-detail-gola.png' },
      { label: 'Manga', src: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-detail-manga.png' },
      { label: 'Tecido', src: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-detail-tecido.png' },
    ],
    modelMockups: [
      { label: 'Costas', src: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-back.png' },
      { label: 'Lateral', src: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-side.png' },
      { label: 'Ângulo direito', src: '/assets/products/mockups/moletom-unissex/preto-presenca/mockup-moletom-unissex-preto-presenca-right-3q.png' },
    ],
    fit: 'oversized',
    fabric: 'Moletom felpado encorpado com toque interno macio para clima ameno.',
    printTypeDescription: 'Serigrafia premium com alta cobertura e opção de bordado localizado.',
    washGuide: 'Lavar do avesso em ciclo suave, secar à sombra e evitar ferro sobre a arte.',
    installmentCount: 4,
    productionDays: 8,
    sizeOptions: ['P', 'M', 'G', 'GG'],
    printOptions: ['Serigrafia premium', 'Bordado localizado'],
    packagingOptions: [
      { name: 'Pack Presença', description: 'Proteção reforçada para peça volumosa com apresentação sóbria.' },
      { name: 'Gift Experience', description: 'Caixa premium com cartão autoral para ocasiões especiais.' },
    ],
    tags: ['Presença', 'Campanha'],
  },
  {
    id: '3',
    name: 'Ecobag Reino',
    category: 'Acessórios',
    catalogCategory: 'Acessórios',
    image: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-front.png',
    hoverImage: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-left-3q.png',
    price: 45,
    segment: 'customizada',
    shortReason: 'Resolve presente, rotina e uso leve sem perder linguagem de marca.',
    stylingTip: 'Use com camisa lisa e acessórios discretos para manter a leitura limpa.',
    promptDescriptor: 'praticidade, presente, rotina',
    colorImages: {
      Areia: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-front.png',
    },
    detailImages: [
      { label: 'Gola', src: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-detail-gola.png' },
      { label: 'Alça', src: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-detail-manga.png' },
      { label: 'Tecido', src: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-detail-tecido.png' },
    ],
    modelMockups: [
      { label: 'Costas', src: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-back.png' },
      { label: 'Lateral', src: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-side.png' },
      { label: 'Ângulo direito', src: '/assets/products/mockups/ecobag/areia-serena/mockup-ecobag-areia-serena-right-3q.png' },
    ],
    fit: 'regular',
    fabric: 'Lona leve de algodão cru com alça reforçada para rotina diária.',
    printTypeDescription: 'Serigrafia premium com leitura frontal limpa e alto contraste.',
    washGuide: 'Limpar com pano úmido e sabão neutro; evitar máquina e secagem direta ao sol.',
    installmentCount: 2,
    productionDays: 5,
    sizeOptions: ['Único'],
    printOptions: ['Serigrafia premium', 'Transfer têxtil'],
    packagingOptions: [
      { name: 'Envelope kraft', description: 'Entrega leve, prática e alinhada ao uso cotidiano.' },
      { name: 'Gift Experience', description: 'Embalagem de presente com cartão autoral e fechamento premium.' },
    ],
    tags: ['Reino', 'Acessórios'],
  },
  {
    id: '4',
    name: 'Boné Presença',
    category: 'Artistas',
    catalogCategory: 'Acessórios',
    image: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-left-3q.png',
    price: 95,
    segment: 'customizada',
    shortReason: 'Ajuda quando a pessoa quer afirmar identidade sem depender de estampa grande.',
    stylingTip: 'Funciona melhor com camadas neutras e silhueta mais seca.',
    promptDescriptor: 'afirmação sutil, identidade, impacto',
    colorImages: {
      'Preto Ruah': '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-front.png',
    },
    detailImages: [
      { label: 'Aba', src: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-detail-gola.png' },
      { label: 'Costura', src: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-detail-manga.png' },
      { label: 'Tecido', src: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-detail-tecido.png' },
    ],
    modelMockups: [
      { label: 'Costas', src: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-back.png' },
      { label: 'Lateral', src: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-side.png' },
      { label: 'Ângulo direito', src: '/assets/products/mockups/bone/preto-presenca/mockup-bone-preto-presenca-right-3q.png' },
    ],
    fit: 'regular',
    fabric: 'Sarja estruturada com ajuste traseiro e frente firme para bordado.',
    printTypeDescription: 'Bordado frontal com opção de aplicação localizada em transfer.',
    washGuide: 'Limpar manualmente com pano úmido, sem torcer ou imergir por longos períodos.',
    installmentCount: 3,
    productionDays: 6,
    sizeOptions: ['Ajustável'],
    printOptions: ['Bordado frontal', 'Transfer localizado'],
    packagingOptions: [
      { name: 'Pack urbano', description: 'Proteção rígida da aba com apresentação enxuta.' },
      { name: 'Gift Experience', description: 'Caixa com cartão autoral para presente ou lançamento.' },
    ],
    tags: ['Presença', 'Acessórios'],
  },
  {
    id: '5',
    name: 'Camiseta Serena',
    category: 'Autoral',
    catalogCategory: 'Autoral',
    image: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-front.png',
    hoverImage: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-left-3q.png',
    price: 65,
    segment: 'base',
    shortReason: 'É a escolha mais versátil para quem precisa de suavidade e uso recorrente.',
    stylingTip: 'Ganhe elegância com tons crus, jeans limpo e poucos elementos concorrendo.',
    promptDescriptor: 'base, suavidade, recorrência',
    colorImages: {
      Areia: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-front.png',
    },
    detailImages: [
      { label: 'Gola', src: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-detail-gola.png' },
      { label: 'Manga', src: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-detail-manga.png' },
      { label: 'Tecido', src: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-detail-tecido.png' },
    ],
    modelMockups: [
      { label: 'Costas', src: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-back.png' },
      { label: 'Lateral', src: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-side.png' },
      { label: 'Ângulo direito', src: '/assets/products/mockups/camiseta-regular/areia-serena/mockup-camiseta-regular-areia-serena-right-3q.png' },
    ],
    fit: 'regular',
    fabric: 'Algodão leve de alta respirabilidade, pensado para uso recorrente.',
    printTypeDescription: 'Serigrafia premium de baixa interferência visual para coleção base.',
    washGuide: 'Lavar do avesso em água fria e secar à sombra para preservar cor e toque.',
    installmentCount: 3,
    productionDays: 6,
    sizeOptions: ['P', 'M', 'G', 'GG'],
    printOptions: ['Serigrafia premium', 'Digital DTG'],
    packagingOptions: [
      { name: 'Pack Serena', description: 'Envelope limpo e funcional para rotina e recompra.' },
      { name: 'Gift Experience', description: 'Apresentação premium com cartão autoral e fechamento rígido.' },
    ],
    tags: ['Serena', 'Base'],
  },
  {
    id: '6',
    name: 'Ecobag Presença',
    category: 'Acessórios',
    catalogCategory: 'Acessórios',
    image: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-front.png',
    hoverImage: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-left-3q.png',
    price: 35,
    segment: 'base',
    shortReason: 'É um ponto de entrada simples para começar pela mensagem e utilidade.',
    stylingTip: 'Use como acento escuro em composições mais claras para equilibrar o conjunto.',
    promptDescriptor: 'entrada de marca, utilidade, contraste',
    colorImages: {
      'Preto Ruah': '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-front.png',
    },
    detailImages: [
      { label: 'Acabamento', src: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-detail-gola.png' },
      { label: 'Alça', src: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-detail-manga.png' },
      { label: 'Tecido', src: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-detail-tecido.png' },
    ],
    modelMockups: [
      { label: 'Costas', src: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-back.png' },
      { label: 'Lateral', src: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-side.png' },
      { label: 'Ângulo direito', src: '/assets/products/mockups/ecobag/preto-presenca/mockup-ecobag-preto-presenca-right-3q.png' },
    ],
    fit: 'regular',
    fabric: 'Lona de algodão com estrutura leve e boa resistência para uso diário.',
    printTypeDescription: 'Serigrafia premium com contraste alto para leitura rápida da mensagem.',
    washGuide: 'Limpar com pano úmido e secar naturalmente; evitar máquina de lavar.',
    installmentCount: 2,
    productionDays: 4,
    sizeOptions: ['Único'],
    printOptions: ['Serigrafia premium', 'Transfer têxtil'],
    packagingOptions: [
      { name: 'Envelope kraft', description: 'Envio objetivo para item leve e de recompra rápida.' },
      { name: 'Gift Experience', description: 'Embalagem com cartão autoral para presente simples e elegante.' },
    ],
    tags: ['Presença', 'Base'],
  },
];

function normalizeBrandMediaItem(item: BrandMediaItem): BrandMediaItem {
  return {
    ...item,
    src: toEditorialCatalogAssetPath(item.src),
  };
}

function normalizeBrandProductSeed(seed: BrandProductSeed): BrandProductSeed {
  return {
    ...seed,
    image: toEditorialCatalogAssetPath(seed.image),
    hoverImage: toEditorialCatalogAssetPath(seed.hoverImage),
    colorImages: Object.fromEntries(
      Object.entries(seed.colorImages).map(([label, src]) => [label, toEditorialCatalogAssetPath(src)])
    ),
    detailImages: seed.detailImages.map(normalizeBrandMediaItem),
    modelMockups: seed.modelMockups.map(normalizeBrandMediaItem),
  };
}

export const BRAND_PRODUCT_SEEDS: BrandProductSeed[] = RAW_BRAND_PRODUCT_SEEDS.map(normalizeBrandProductSeed);

const HOME_PRODUCT_IDS = ['1', '2', '3', '4'] as const;
const HOME_PRODUCT_BADGES: Partial<Record<string, string>> = { '1': 'Popular', '3': 'Novo' };
const CATEGORY_PRODUCT_BADGES: Partial<Record<string, string>> = { '6': 'Limitado' };

function mapSeedToCard(seed: BrandProductSeed, badge?: string): BrandProductCard {
  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    price: seed.price,
    image: seed.image,
    hoverImage: seed.hoverImage,
    badge,
  };
}

export const BRAND_PRODUCT_VISUALS: BrandProductVisual[] = BRAND_PRODUCT_SEEDS.map(
  ({ id, name, category, image, hoverImage }) => ({ id, name, category, image, hoverImage })
);

export const BRAND_HOME_PRODUCTS: BrandProductCard[] = BRAND_PRODUCT_SEEDS
  .filter((seed) => HOME_PRODUCT_IDS.includes(seed.id as (typeof HOME_PRODUCT_IDS)[number]))
  .map((seed) => mapSeedToCard(seed, HOME_PRODUCT_BADGES[seed.id]));

export const BRAND_CATEGORY_PRODUCTS: BrandProductCard[] = BRAND_PRODUCT_SEEDS.map((seed) =>
  mapSeedToCard(seed, CATEGORY_PRODUCT_BADGES[seed.id])
);

export const BRAND_CATEGORY_CARDS: BrandCategoryCard[] = [
  {
    name: 'Autoral',
    image: BRAND_PRODUCT_SEEDS[0].image,
    link: '/category/autoral',
  },
  {
    name: 'Campanhas',
    image: BRAND_PRODUCT_SEEDS[1].image,
    link: '/category/campanhas',
  },
  {
    name: 'Acessórios',
    image: BRAND_PRODUCT_SEEDS[2].image,
    link: '/category/acessorios',
  },
];

export const BRAND_SEARCH_SUGGESTIONS: BrandSearchSuggestion[] = [
  {
    id: '1',
    name: BRAND_PRODUCT_SEEDS[0].name,
    category: BRAND_PRODUCT_SEEDS[0].category,
    reason: 'Leitura limpa para quem quer mensagem contemplativa sem excesso.',
  },
  {
    id: '2',
    name: BRAND_PRODUCT_SEEDS[1].name,
    category: BRAND_PRODUCT_SEEDS[1].category,
    reason: 'Boa escolha para conforto, presença e encontros com mais densidade visual.',
  },
  {
    id: '3',
    name: BRAND_PRODUCT_SEEDS[2].name,
    category: BRAND_PRODUCT_SEEDS[2].category,
    reason: 'Praticidade com propósito para rotina, presente e uso leve.',
  },
];

export const BRAND_BOOTSTRAP_SEEDS: BrandBootstrapSeed[] = BRAND_PRODUCT_SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  price: seed.price,
  image: seed.image,
  catalogCategory: seed.catalogCategory,
  segment: seed.segment,
  productBaseId: `BASE-${seed.id}`,
  colorImages: seed.colorImages,
  detailImages: seed.detailImages,
  modelMockups: seed.modelMockups,
  fit: seed.fit,
  fabric: seed.fabric,
  printTypeDescription: seed.printTypeDescription,
  washGuide: seed.washGuide,
  installmentCount: seed.installmentCount,
  productionDays: seed.productionDays,
  sizeOptions: seed.sizeOptions,
  printOptions: seed.printOptions,
  packagingOptions: seed.packagingOptions,
  tags: seed.tags,
}));

const PRODUCT_VISUAL_BY_ID = Object.fromEntries(
  BRAND_PRODUCT_VISUALS.map((item) => [item.id, item])
) as Record<string, BrandProductVisual>;

const PRODUCT_SEED_BY_ID = Object.fromEntries(
  BRAND_PRODUCT_SEEDS.map((item) => [item.id, item])
) as Record<string, BrandProductSeed>;

export function findBrandProductSeed(productId: string) {
  return PRODUCT_SEED_BY_ID[productId];
}

export function getBrandProductVisual(productId: string) {
  return PRODUCT_VISUAL_BY_ID[productId] ?? BRAND_PRODUCT_VISUALS[0];
}

export function getBrandProductSeed(productId: string) {
  return PRODUCT_SEED_BY_ID[productId] ?? BRAND_PRODUCT_SEEDS[0];
}

export function findBrandProductMerchandising(productId: string): BrandProductMerchandising | undefined {
  const seed = findBrandProductSeed(productId);
  if (!seed) return undefined;

  return {
    id: seed.id,
    name: seed.name,
    price: seed.price,
    image: seed.image,
    hoverImage: seed.hoverImage,
    category: seed.catalogCategory,
    segment: seed.segment === 'base' ? 'Base' : 'Customizada',
    tags: seed.tags,
    colorImages: seed.colorImages,
    detailImages: seed.detailImages,
    modelMockups: seed.modelMockups,
    fit: seed.fit,
    fabric: seed.fabric,
    printTypeDescription: seed.printTypeDescription,
    washGuide: seed.washGuide,
    installmentCount: seed.installmentCount,
    productionDays: seed.productionDays,
    sizeOptions: seed.sizeOptions,
    printOptions: seed.printOptions,
    packagingOptions: seed.packagingOptions,
  };
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
import { toEditorialCatalogAssetPath } from '@/lib/product-artwork';
