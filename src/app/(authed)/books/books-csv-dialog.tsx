"use client";

import { useActionState, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { CsvFormatGuide } from "@/components/csv-format-guide";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type CsvColumn, xlsxToCsv } from "@/lib/csv-template";
import { cn } from "@/lib/utils";

import { importBooksCsv, type CsvImportState } from "./actions";

const INITIAL_STATE: CsvImportState = {};

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
    csv: "grade_level",
    label: "권장 학년",
    required: false,
    example: "1",
    choices: ["", "1", "2", "3", "4", "5", "6"],
  },
  {
    csv: "level",
    label: "단계 / 레벨",
    required: false,
    example: "1단계",
    hint: "한국어=단계, 영어=레벨 (자유 텍스트)",
  },
  {
    csv: "cover_image_url",
    label: "표지 URL",
    required: false,
    example: "",
    hint: "외부 URL을 그대로 저장 (다운로드·재호스팅 X)",
  },
];

export function BooksCsvDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState<CsvImportState, FormData>(
    importBooksCsv,
    INITIAL_STATE,
  );

  const hasResult = state.results !== undefined;
  const failed = state.results?.filter((r) => r.error) ?? [];
  const succeeded = state.successCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>책 일괄 업로드</DialogTitle>
          <DialogDescription>
            CSV 또는 XLSX 파일로 책을 한 번에 등록합니다. 바코드 ID는 자동
            발급됩니다.
          </DialogDescription>
        </DialogHeader>

        {hasResult ? (
          <ResultPanel
            succeeded={succeeded}
            failed={failed}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <UploadForm
            formAction={formAction}
            pending={pending}
            error={state.error}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const SECTION_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

function UploadForm({
  formAction,
  pending,
  error,
  onCancel,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  onCancel: () => void;
}) {
  const [fileName, setFileName] = useState<string>("");
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      setConverting(true);
      try {
        const csv = await xlsxToCsv(file);
        const csvFile = new File(
          [csv],
          file.name.replace(/\.xlsx$/i, ".csv"),
          { type: "text/csv" },
        );
        const dt = new DataTransfer();
        dt.items.add(csvFile);
        if (fileInputRef.current) fileInputRef.current.files = dt.files;
        setFileName(file.name);
      } finally {
        setConverting(false);
      }
    } else {
      setFileName(file.name);
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <CsvFormatGuide
        columns={BOOK_COLUMNS}
        templateBaseName="books-template"
      />

      <p className="text-xs text-muted-foreground">
        바코드 ID는 시스템이 자동 발급합니다. CSV에 포함하지 마세요.
      </p>

      <section className="space-y-2.5">
        <Label htmlFor="csv-file" className={SECTION_LABEL_CLASS}>
          파일 선택
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          id="csv-file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={handleFileChange}
          required
          disabled={pending || converting}
        />
        <label
          htmlFor="csv-file"
          className={cn(
            "flex cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed px-4 py-6 text-sm transition-colors",
            pending || converting
              ? "cursor-not-allowed opacity-50"
              : "hover:border-foreground/30 hover:bg-muted/40",
          )}
        >
          <Upload className="size-4 text-muted-foreground" />
          {converting ? (
            <span className="text-muted-foreground">XLSX 변환 중…</span>
          ) : fileName ? (
            <span className="font-medium">{fileName}</span>
          ) : (
            <span className="text-muted-foreground">
              CSV 또는 XLSX 파일 선택…
            </span>
          )}
        </label>
      </section>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending || converting}
        >
          취소
        </Button>
        <Button type="submit" disabled={pending || converting}>
          {pending ? "업로드 중…" : "업로드"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ResultPanel({
  succeeded,
  failed,
  onClose,
}: {
  succeeded: number;
  failed: Array<{ row: number; title: string; error?: string }>;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="text-xs text-muted-foreground">성공</div>
          <div className="mt-1 text-2xl font-semibold">{succeeded}</div>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="text-xs text-muted-foreground">실패</div>
          <div className="mt-1 text-2xl font-semibold text-destructive">
            {failed.length}
          </div>
        </div>
      </div>

      {failed.length > 0 ? (
        <section className="space-y-2.5">
          <Label className={SECTION_LABEL_CLASS}>실패 행</Label>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-muted/20 p-3 font-mono text-xs">
            {failed.map((r) => (
              <li key={r.row} className="flex gap-2">
                <span className="text-muted-foreground">행 {r.row}</span>
                {r.title ? <span>{r.title}</span> : null}
                <span className="text-destructive">— {r.error}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DialogFooter>
        <Button type="button" onClick={onClose}>
          닫기
        </Button>
      </DialogFooter>
    </div>
  );
}
