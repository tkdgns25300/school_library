"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ScanLine } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LANGUAGE_LABEL } from "@/constants/languages";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

const DEFAULT_DUE_DAYS = 7;

const LANGUAGE_SUBTITLE: Record<Language, string> = {
  ko: "동화 · 그림책 · 지식책",
  en: "Picture books · Readers · Chapter books",
};

type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

type Mode = "lend" | "return";

export function LanguageColumn({
  language,
  students,
  teachers,
}: {
  language: Language;
  students: Student[];
  teachers: Teacher[];
}) {
  const [mode, setMode] = useState<Mode>("lend");
  const [studentId, setStudentId] = useState<string | undefined>();
  const [teacherId, setTeacherId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_DUE_DAYS);
    return d;
  });
  const [barcode, setBarcode] = useState<string>("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  const isKo = language === "ko";
  const accentClass = isKo ? "border-l-ko" : "border-l-en";
  const badgeClass = isKo
    ? "bg-ko text-ko-foreground"
    : "bg-en text-en-foreground";

  // TODO(S1-5c): 실제 권수·연체 계산
  const activeCount = 0;
  const overdueCount = 0;

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = barcode.trim();
    if (value === "") return;
    // TODO(S1-5c): Server Action lendBook / returnBook
    setBarcode("");
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm",
        accentClass,
      )}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-md px-2 text-[11px] font-bold uppercase tracking-wider",
              badgeClass,
            )}
          >
            {LANGUAGE_LABEL[language].short}
          </span>
          <div>
            <div className="text-base font-semibold leading-tight">
              {LANGUAGE_LABEL[language].full}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {LANGUAGE_SUBTITLE[language]}
            </div>
          </div>
        </div>
        <div className="text-right text-sm leading-tight">
          <div>
            <span className="text-lg font-bold">{activeCount}</span>
            <span className="text-muted-foreground"> 권 대여</span>
          </div>
          {overdueCount > 0 ? (
            <div className="mt-0.5 text-xs font-semibold text-destructive">
              연체 {overdueCount}권
            </div>
          ) : null}
        </div>
      </div>

      <Separator />

      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "lend" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("lend")}
          >
            대여
          </Button>
          <Button
            type="button"
            variant={mode === "return" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("return")}
          >
            반납
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              학생
            </Label>
            <Select
              value={studentId}
              onValueChange={(v) => setStudentId(v ?? undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="학생 선택" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.grade}학년 {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "lend" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                반납 예정일
              </Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-start gap-2 font-normal",
                  )}
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {format(dueDate, "yyyy-MM-dd")}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => {
                      if (d) setDueDate(d);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            담당 교사
          </Label>
          <Select
            value={teacherId}
            onValueChange={(v) => setTeacherId(v ?? undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="교사 선택" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor={`barcode-${language}`}
            className="text-xs font-medium text-muted-foreground"
          >
            바코드 스캔
          </Label>
          <div className="flex gap-2">
            <Input
              id={`barcode-${language}`}
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="BK00001"
              autoFocus
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => barcodeRef.current?.focus()}
            >
              <ScanLine className="size-4" />
              스캔
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {mode === "lend"
              ? "스캔하면 책 표지가 여기 표시됩니다"
              : `반납 가능 · 현재 대여 중 ${activeCount}권`}
          </div>
          <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
            {mode === "lend"
              ? "대여할 책을 스캔하세요"
              : "대여 중 도서 리스트는 다음 단계에서 표시됩니다"}
          </div>
        </div>
      </div>
    </div>
  );
}
