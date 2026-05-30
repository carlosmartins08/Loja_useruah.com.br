export const MOTION_DURATION = {
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  glacial: 0.7,
} as const;

export const MOTION_EASING = {
  enter: [0.22, 1, 0.36, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  emphasis: [0.2, 0.8, 0.2, 1] as const,
  circOut: 'circOut' as const,
} as const;

export const MOTION_STAGGER = {
  section: 0.08,
} as const;

