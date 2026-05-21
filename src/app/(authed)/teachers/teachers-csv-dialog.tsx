"use client";

import { CsvImportDialog } from "@/components/csv-import-dialog";
import type { CsvColumn } from "@/lib/csv-template";

import { importTeachersCsv } from "./actions";

const TEACHER_COLUMNS: ReadonlyArray<CsvColumn> = [
  { csv: "name", label: "이름", required: true, example: "김지영" },
  {
    csv: "class_section",
    label: "담당 반",
    required: true,
    example: "junior 1",
    choices: ["junior 1", "junior 2", "senior 1"],
  },
];

export function TeachersCsvDialog({
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
      title="교사 일괄 업로드"
      description="CSV 또는 XLSX 파일로 교사 명단을 한 번에 등록합니다."
      columns={TEACHER_COLUMNS}
      templateBaseName="teachers-template"
      action={importTeachersCsv}
    />
  );
}
