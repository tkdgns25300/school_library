export type CsvImportResult = {
  row: number;
  // 실패 표시용 식별자 — 학생·교사는 이름, 책은 제목 등 도메인이 의미 있는 한 단어.
  label: string;
  error?: string;
};

export type CsvImportState = {
  error?: string;
  successCount?: number;
  results?: CsvImportResult[];
};
