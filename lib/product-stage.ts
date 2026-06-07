export interface ProductStageTone {
  frameClassName: string;
  surfaceClassName: string;
  glowClassName: string;
  imageClassName: string;
}

const LIGHT_STAGE: ProductStageTone = {
  frameClassName: 'bg-[linear-gradient(155deg,#fcfaf5_0%,#f1eadf_48%,#e7ddce_100%)] border-ruah-100',
  surfaceClassName: 'bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.96),rgba(255,255,255,0.42)_45%,rgba(197,160,89,0.14)_76%,transparent_100%)]',
  glowClassName: 'bg-[radial-gradient(circle_at_50%_30%,rgba(197,160,89,0.26),transparent_62%)] opacity-90',
  imageClassName: 'object-contain p-4 md:p-7 drop-shadow-[0_18px_28px_rgba(120,98,61,0.18)]',
};

const DARK_STAGE: ProductStageTone = {
  frameClassName: 'bg-[linear-gradient(160deg,#2e3134_0%,#15181b_55%,#0f1113_100%)] border-[#2f3337]',
  surfaceClassName: 'bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_42%,transparent_72%)]',
  glowClassName: 'bg-[radial-gradient(circle_at_50%_32%,rgba(197,160,89,0.28),transparent_58%)] opacity-80',
  imageClassName: 'object-contain p-4 md:p-7 drop-shadow-[0_24px_36px_rgba(0,0,0,0.32)]',
};

const NEUTRAL_STAGE: ProductStageTone = {
  frameClassName: 'bg-[linear-gradient(155deg,#f7f4ee_0%,#efe8db_52%,#e5ddd1_100%)] border-ruah-100',
  surfaceClassName: 'bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.92),rgba(255,255,255,0.28)_48%,transparent_82%)]',
  glowClassName: 'bg-[radial-gradient(circle_at_50%_32%,rgba(23,44,54,0.16),transparent_60%)] opacity-70',
  imageClassName: 'object-contain p-4 md:p-7 drop-shadow-[0_20px_30px_rgba(69,58,40,0.12)]',
};

export function getProductStageTone(imageSrc: string): ProductStageTone {
  const normalized = imageSrc.toLowerCase();

  if (normalized.includes('preto')) return DARK_STAGE;
  if (normalized.includes('offwhite') || normalized.includes('areia')) return LIGHT_STAGE;
  return NEUTRAL_STAGE;
}
