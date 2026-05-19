"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  downloadCsvTemplate,
  downloadXlsxTemplate,
  type CsvColumn,
} from "@/lib/csv-template";

export function CsvFormatGuide({
  columns,
  templateBaseName,
}: {
  columns: ReadonlyArray<CsvColumn>;
  templateBaseName: string;
}) {
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);

  async function handleDownload(format: "csv" | "xlsx") {
    setDownloading(format);
    try {
      if (format === "xlsx") {
        await downloadXlsxTemplate(`${templateBaseName}.xlsx`, columns);
      } else {
        downloadCsvTemplate(`${templateBaseName}.csv`, columns);
      }
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">파일 양식</span>
        </div>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDownload("xlsx")}
            disabled={downloading !== null}
          >
            <Download className="size-3.5" />
            XLSX
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleDownload("csv")}
            disabled={downloading !== null}
          >
            <Download className="size-3.5" />
            CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.csv}
                  className="border-r px-3 py-2.5 align-top text-left last:border-r-0"
                >
                  <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                    <span className="font-semibold">{c.label}</span>
                    {c.required ? (
                      <span className="text-xs font-bold text-destructive">
                        *
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] font-normal text-muted-foreground">
                    {c.csv}
                  </div>
                  {c.choices ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.choices.map((ch) => (
                        <span
                          key={ch}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  ) : c.hint ? (
                    <div className="mt-1 text-[11px] font-normal text-muted-foreground">
                      {c.hint}
                    </div>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              {columns.map((c) => (
                <td
                  key={c.csv}
                  className="whitespace-nowrap border-r px-3 py-2 font-mono text-xs last:border-r-0"
                >
                  {c.example || (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="size-3.5" />
        XLSX는 학년·반 등을 드롭다운으로 선택할 수 있습니다.
        <span className={cn("ml-auto", "text-destructive")}>*</span>
        <span>필수</span>
      </p>
    </div>
  );
}
