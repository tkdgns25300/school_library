"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";

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
import { cn } from "@/lib/utils";

import { importStudentsCsv, type CsvImportState } from "./actions";

const INITIAL_STATE: CsvImportState = {};

const SAMPLE_CSV = `name,grade,class_section
홍길동,3,junior 2
김영희,5,senior 1
이도윤,1,junior 1`;

export function StudentsCsvDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState<CsvImportState, FormData>(
    importStudentsCsv,
    INITIAL_STATE,
  );

  const hasResult = state.results !== undefined;
  const failed = state.results?.filter((r) => r.error) ?? [];
  const succeeded = state.successCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>학생 CSV 일괄 업로드</DialogTitle>
          <DialogDescription>
            CSV 파일로 학생 명단을 한 번에 등록합니다.
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

  return (
    <form action={formAction} className="space-y-5">
      <section className="space-y-2.5">
        <Label className={SECTION_LABEL_CLASS}>CSV 포맷</Label>
        <pre className="overflow-x-auto rounded-md border border-l-2 border-l-primary/40 bg-muted/40 px-4 py-3 font-mono text-xs leading-relaxed">
          {SAMPLE_CSV}
        </pre>
        <ul className="space-y-1 pl-1 text-xs text-muted-foreground">
          <li>· UTF-8 인코딩 · 헤더 행 필수</li>
          <li>
            · <code className="font-mono">grade</code>는 1~6,{" "}
            <code className="font-mono">class_section</code>은{" "}
            <code className="font-mono">junior 1</code> ·{" "}
            <code className="font-mono">junior 2</code> ·{" "}
            <code className="font-mono">senior 1</code>
          </li>
          <li>· 1~3학년은 junior, 4~6학년은 senior 1만 유효</li>
        </ul>
      </section>

      <section className="space-y-2.5">
        <Label htmlFor="csv-file" className={SECTION_LABEL_CLASS}>
          파일 선택
        </Label>
        <input
          type="file"
          name="file"
          id="csv-file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          required
          disabled={pending}
        />
        <label
          htmlFor="csv-file"
          className={cn(
            "flex cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed px-4 py-6 text-sm transition-colors",
            pending
              ? "cursor-not-allowed opacity-50"
              : "hover:border-foreground/30 hover:bg-muted/40",
          )}
        >
          <Upload className="size-4 text-muted-foreground" />
          {fileName ? (
            <span className="font-medium">{fileName}</span>
          ) : (
            <span className="text-muted-foreground">CSV 파일 선택…</span>
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
          disabled={pending}
        >
          취소
        </Button>
        <Button type="submit" disabled={pending}>
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
  failed: Array<{ row: number; name: string; error?: string }>;
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
                {r.name ? <span>{r.name}</span> : null}
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
