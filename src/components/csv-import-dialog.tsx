"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
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
import {
  type CsvImportResult,
  type CsvImportState,
} from "@/lib/csv-import";
import { type CsvColumn, xlsxToCsv } from "@/lib/csv-template";
import { cn } from "@/lib/utils";

const INITIAL_STATE: CsvImportState = {};
const SECTION_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function CsvImportDialog({
  open,
  onOpenChange,
  title,
  description,
  columns,
  templateBaseName,
  action,
  notice,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  columns: ReadonlyArray<CsvColumn>;
  templateBaseName: string;
  action: (
    state: CsvImportState,
    formData: FormData,
  ) => Promise<CsvImportState>;
  notice?: ReactNode;
  // 컬럼 수가 많은 양식(예: 책)은 가로폭을 더 크게.
  wide?: boolean;
}) {
  const [state, formAction, pending] = useActionState<CsvImportState, FormData>(
    action,
    INITIAL_STATE,
  );

  const hasResult = state.results !== undefined;
  const failed = state.results?.filter((r) => r.error) ?? [];
  const succeeded = state.successCount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={wide ? "sm:max-w-5xl" : "sm:max-w-xl"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            columns={columns}
            templateBaseName={templateBaseName}
            notice={notice}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UploadForm({
  formAction,
  pending,
  error,
  columns,
  templateBaseName,
  notice,
  onCancel,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  columns: ReadonlyArray<CsvColumn>;
  templateBaseName: string;
  notice?: ReactNode;
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

  const busy = pending || converting;

  return (
    <form action={formAction} className="space-y-5">
      <CsvFormatGuide columns={columns} templateBaseName={templateBaseName} />

      {notice ? (
        <p className="text-xs text-muted-foreground">{notice}</p>
      ) : null}

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
          disabled={busy}
        />
        <label
          htmlFor="csv-file"
          className={cn(
            "flex cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed px-4 py-6 text-sm transition-colors",
            busy
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
          disabled={busy}
        >
          취소
        </Button>
        <Button type="submit" disabled={busy}>
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
  failed: CsvImportResult[];
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
                {r.label ? <span>{r.label}</span> : null}
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
