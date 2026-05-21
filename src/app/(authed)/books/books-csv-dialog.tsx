"use client";

import { CsvImportDialog } from "@/components/csv-import-dialog";
import { BOOK_LEVEL_CHOICES } from "@/constants/levels";
import type { CsvColumn } from "@/lib/csv-template";

import { importBooksCsv } from "./actions";

const BOOK_COLUMNS: ReadonlyArray<CsvColumn> = [
  { csv: "title", label: "제목", required: true, example: "강아지똥" },
  {
    csv: "language",
    label: "언어",
    required: true,
    example: "ko",
    choices: ["ko", "en"],
  },
  { csv: "author", label: "저자", required: false, example: "권정생" },
  { csv: "publisher", label: "출판사", required: false, example: "길벗어린이" },
  {
    csv: "level",
    label: "단계 / 레벨",
    required: true,
    example: "1",
    choices: BOOK_LEVEL_CHOICES,
    hint: "1~13 중 선택 (한국어=단계, 영어=레벨)",
  },
  {
    csv: "cover_image_url",
    label: "표지 URL",
    required: true,
    example: "https://example.com/cover.jpg",
    hint: "외부 URL 필수 (이미지 호스팅 후 URL 입력)",
  },
];

export function BooksCsvDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <CsvImportDialog
      open={open}
      onOpenChange={onOpenChange}
      title="책 일괄 업로드"
      description="CSV 또는 XLSX 파일로 책을 한 번에 등록합니다. 바코드 ID는 자동 발급됩니다."
      columns={BOOK_COLUMNS}
      templateBaseName="books-template"
      action={importBooksCsv}
      notice="바코드 ID는 시스템이 자동 발급합니다. CSV에 포함하지 마세요."
      wide
    />
  );
}
