"use client";

import { CsvImportDialog } from "@/components/csv-import-dialog";
import type { CsvColumn } from "@/lib/csv-template";

import { importStudentsCsv } from "./actions";

const STUDENT_COLUMNS: ReadonlyArray<CsvColumn> = [
  { csv: "name", label: "이름", required: true, example: "홍길동" },
  {
    csv: "grade",
    label: "학년",
    required: true,
    example: "3",
    choices: ["1", "2", "3", "4", "5", "6"],
  },
  {
    csv: "class_section",
    label: "반",
    required: true,
    example: "junior 2",
    choices: ["junior 1", "junior 2", "senior 1"],
  },
];

export function StudentsCsvDialog({
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
      title="학생 일괄 업로드"
      description="CSV 또는 XLSX 파일로 학생 명단을 한 번에 등록합니다."
      columns={STUDENT_COLUMNS}
      templateBaseName="students-template"
      action={importStudentsCsv}
    />
  );
}
