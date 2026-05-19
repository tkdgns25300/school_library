// ImageResponse는 Edge 런타임에서 실행돼 CSS 변수(`--primary`)를 못 읽음.
// 여기 hex 값은 globals.css의 `--primary` (oklch 0.32 0.13 262)와 시각적으로 정렬.
export const BRAND_NAVY = {
  dark: "#1a2461",
  base: "#2d3a8c",
  light: "#4453b3",
} as const;

export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_NAVY.dark} 0%, ${BRAND_NAVY.base} 50%, ${BRAND_NAVY.light} 100%)`;
