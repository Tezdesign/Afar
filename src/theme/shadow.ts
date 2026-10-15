// Mirrors --shadow-card in src/global.css. Native shadows can't read the CSS
// variable, so this is the one place the numbers are repeated.
export const CARD_SHADOW = {
  shadowColor: "#17181F",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;
