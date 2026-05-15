import type { Language } from "@/types/domain";

export const LANGUAGE_LABEL: Record<Language, { short: string; full: string }> = {
  ko: { short: "KO", full: "한국어 도서" },
  en: { short: "EN", full: "English Books" },
};

export const LANGUAGE_LEVEL_TERM: Record<Language, string> = {
  ko: "단계",
  en: "레벨",
};

export const LANGUAGE_SUBTITLE: Record<Language, string> = {
  ko: "동화 · 그림책 · 지식책",
  en: "Picture books · Readers · Chapter books",
};
