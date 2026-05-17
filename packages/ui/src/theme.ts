export const colors = {
  background: "#f4f8fa",
  backgroundAlt: "#eaf3f5",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#eef6f6",
  surfaceStrong: "#dcecee",
  ink: "#0d1b22",
  inkMuted: "#53666f",
  inkSubtle: "#7a8b92",
  border: "#d8e5e6",
  borderStrong: "#b8ced1",
  primary: "#00857d",
  primaryDark: "#063f3d",
  primarySoft: "#d9f4f0",
  primaryMist: "#effbfa",
  accent: "#b7e64a",
  accentSoft: "#eef9d7",
  amber: "#f2a42a",
  amberSoft: "#fff1d2",
  danger: "#d9483d",
  dangerSoft: "#ffe4df",
  coral: "#ef715f",
  blue: "#2364d8",
  graphite: "#101820",
  aqua: "#51d9df",
  white: "#ffffff"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 72
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 22,
  round: 999
} as const;

export const typography = {
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  sizes: {
    caption: 12,
    label: 13,
    body: 16,
    lead: 18,
    title: 22,
    heading: 34,
    hero: 58
  },
  lineHeights: {
    caption: 16,
    body: 24,
    lead: 28,
    title: 28,
    heading: 40,
    hero: 62
  },
  weights: {
    regular: "400",
    medium: "600",
    bold: "800",
    black: "900"
  }
} as const;

export const shadows = {
  soft: {
    elevation: 2,
    shadowColor: "#0d1b22",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20
  },
  medium: {
    elevation: 4,
    shadowColor: "#0d1b22",
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 30
  }
} as const;

export const motion = {
  fastMs: 160,
  baseMs: 280,
  slowMs: 460
} as const;
