export const fontFamily = {
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const;

// Mirrors the .text-display / .text-title / .text-body / .text-caption /
// .text-numeric utilities in global.css — use those className-first, and
// reach for these only where a className isn't available (e.g. navigation
// header options, third-party components that take a style object).
export const textStyles = {
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  body: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 25.6,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  numeric: {
    fontFamily: fontFamily.extrabold,
    fontSize: 24,
    lineHeight: 28,
  },
} as const;
