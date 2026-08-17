// 4px grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Generous on surfaces, pill-shaped on actions
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const shadow = {
  card: "0px 2px 8px rgba(23, 24, 31, 0.08)",
  raised: "0px 8px 24px rgba(23, 24, 31, 0.16)",
} as const;
