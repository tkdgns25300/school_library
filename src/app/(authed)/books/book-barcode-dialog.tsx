"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LANGUAGE_LEVEL_TERM } from "@/constants/languages";
import { downloadLabelsPdf } from "@/lib/download-labels";
import type { Language } from "@/types/domain";

type Book = {
  id: string;
  title: string;
  author: string | null;
  language: string;
  level: string | null;
};

export function BookBarcodeDialog({
  book,
  open,
  onOpenChange,
}: {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open || !book) return;

    let cancelled = false;
    (async () => {
      const { default: bwipjs } = await import("bwip-js/browser");
      if (cancelled || !canvasRef.current) return;
      bwipjs.toCanvas(canvasRef.current, {
        bcid: "code128",
        text: book.id,
        scale: 4,
        height: 18,
        includetext: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, book]);

  if (!book) return null;

  const lang = (book.language === "en" ? "en" : "ko") as Language;
  const levelTerm = LANGUAGE_LEVEL_TERM[lang];

  async function handleDownload() {
    if (!book) return;
    setDownloading(true);
    try {
      await downloadLabelsPdf([{ id: book.id }]);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{book.id}</DialogTitle>
          <DialogDescription>{book.title}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-6">
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
          <div className="mt-3 space-y-0.5 text-center">
            <div className="font-mono text-sm font-semibold">{book.id}</div>
            <div className="text-xs text-muted-foreground">
              {book.author ? `${book.author}` : ""}
              {book.author && book.level ? " · " : ""}
              {book.level ? `${levelTerm} ${book.level}` : ""}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={downloading}
          >
            닫기
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "다운로드 중…" : "PDF 다운로드"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
