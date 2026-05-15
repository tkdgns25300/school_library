"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

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
import { LANGUAGE_LABEL } from "@/constants/languages";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

const DEFAULT_DUE_DAYS = 7;

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

  const isKo = language === "ko";
  const accentClass = isKo ? "border-l-ko" : "border-l-en";
  const badgeClass = isKo
    ? "bg-ko text-ko-foreground"
    : "bg-en text-en-foreground";

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = barcode.trim();
    if (value === "") return;
    // TODO(S1-5c): Server Action lendBook / returnBook 호출
    setBarcode("");
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm",
        accentClass,
      )}
    >
      <div className="flex items-center justify-between border-b p-4">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold",
            badgeClass,
          )}
        >
          <span>{LANGUAGE_LABEL[language].short}</span>
          <span>{LANGUAGE_LABEL[language].full}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          대여 중 0권 · 연체 0권
        </span>
      </div>

      <div className="space-y-4 p-4">
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
          <Input
            id={`barcode-${language}`}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            placeholder="BK00001"
            autoFocus
            className="font-mono"
          />
        </div>

        <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-xs text-muted-foreground">
          스캔하면 책 표지가 여기 표시됩니다.
        </div>

        <div className="rounded-md border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          대여 중 도서 리스트는 다음 단계에서 표시됩니다.
        </div>
      </div>
    </div>
  );
}
