import type { Language } from "@/types/domain";

export const BOOK_LEVEL_MIN = 1;
export const BOOK_LEVEL_MAX = 13;

export const BOOK_LEVELS: ReadonlyArray<number> = Array.from(
  { length: BOOK_LEVEL_MAX - BOOK_LEVEL_MIN + 1 },
  (_, i) => BOOK_LEVEL_MIN + i,
);

export const BOOK_LEVEL_CHOICES: ReadonlyArray<string> = BOOK_LEVELS.map(String);

export function isValidBookLevel(value: string): boolean {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= BOOK_LEVEL_MIN && n <= BOOK_LEVEL_MAX;
}

export function formatBookLevel(
  level: string | null,
  language: Language,
): string | null {
  if (!level) return null;
  return language === "ko" ? `${level}단계` : `Level ${level}`;
}
