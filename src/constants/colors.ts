// Mirrors the tokens in tailwind.config.js. Use only for props that
// can't take a className (icon colors, native tab bar, SVG).

export const colors = {
  canvas: "#F6FAF3",
  surface: "#FFFFFF",
  ink: "#22332A",
  muted: "#6B7C71",
  primary: "#4FA06A",
  primarySoft: "#E1F2E6",
  accent: "#F3A04B",
  accentSoft: "#FDEBD2",
  riskLow: "#4FA06A",
  riskMid: "#E3B02F",
  riskHigh: "#DE5A4E",
} as const;
