"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { todayIso } from "@/lib/date";
import type { ActiveLoan, Student, Teacher } from "@/lib/queries/operation";
import { cn } from "@/lib/utils";
import type { ClassSection, Language } from "@/types/domain";

import { lendBook, returnBook, type ScannedBook } from "./actions";

const DEFAULT_DUE_DAYS = 7;

type Mode = "lend" | "return";

function overdueDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function LanguageColumn({
  language,
  section,
  students,
  teachers,
  loans,
}: {
  language: Language;
  section: ClassSection;
  students: Student[];
  teachers: Teacher[];
  loans: ActiveLoan[];
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
  const [lastBook, setLastBook] = useState<ScannedBook | null>(null);
  const [scanning, startScan] = useTransition();
  const barcodeRef = useRef<HTMLInputElement>(null);

  const isKo = language === "ko";
  const accentClass = isKo ? "border-l-ko" : "border-l-en";
  const badgeClass = isKo
    ? "bg-ko text-ko-foreground"
    : "bg-en text-en-foreground";

  const today = todayIso();
  const overdueLoans = loans.filter((l) => l.due_date < today);

  function handleScan() {
    const value = barcode.trim();
    if (value === "") return;

    if (mode === "lend") {
      if (!studentId) {
        toast.error("학생을 먼저 선택해주세요");
        return;
      }
      if (!teacherId) {
        toast.error("담당 교사를 먼저 선택해주세요");
        return;
      }

      startScan(async () => {
        const result = await lendBook({
          section,
          language,
          bookId: value,
          studentId,
          teacherId,
          dueDate: format(dueDate, "yyyy-MM-dd"),
        });
        setBarcode("");
        barcodeRef.current?.focus();
        if (result.error) {
          toast.error(result.error);
          if (result.book) setLastBook(result.book);
          return;
        }
        toast.success(`'${result.book?.title ?? value}' 대여 완료`);
        setLastBook(result.book ?? null);
      });
      return;
    }

    if (!teacherId) {
      toast.error("담당 교사를 먼저 선택해주세요");
      return;
    }
    startScan(async () => {
      const result = await returnBook({
        section,
        language,
        bookId: value,
        teacherId,
      });
      setBarcode("");
      barcodeRef.current?.focus();
      if (result.error) {
        toast.error(result.error);
        if (result.book) setLastBook(result.book);
        return;
      }
      toast.success(`'${result.book?.title ?? value}' 반납 완료`);
      setLastBook(result.book ?? null);
    });
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleScan();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm",
        accentClass,
      )}
    >
      <ColumnHeader
        language={language}
        badgeClass={badgeClass}
        activeCount={loans.length}
        overdueCount={overdueLoans.length}
      />

      <Separator />

      <div className="space-y-4 p-5">
        <ModeToggle mode={mode} onChange={setMode} />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SelectField label="학생">
            <Select
              value={studentId}
              onValueChange={(v) => setStudentId(v ?? undefined)}
              disabled={scanning}
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
          </SelectField>

          {mode === "lend" ? (
            <SelectField label="반납 예정일">
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-start gap-2 font-normal",
                  )}
                  disabled={scanning}
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
            </SelectField>
          ) : null}
        </div>

        <SelectField label="담당 교사">
          <Select
            value={teacherId}
            onValueChange={(v) => setTeacherId(v ?? undefined)}
            disabled={scanning}
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
        </SelectField>

        <SelectField label="바코드 스캔">
          <div className="flex gap-2">
            <Input
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="BK00001"
              autoFocus
              disabled={scanning}
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => barcodeRef.current?.focus()}
              disabled={scanning}
            >
              <ScanLine className="size-4" />
              스캔
            </Button>
          </div>
        </SelectField>

        <ScannedBookPreview book={lastBook} placeholderMode={mode} />

        <Separator />

        <ActiveLoanList loans={loans} mode={mode} />
      </div>
    </div>
  );
}

function ColumnHeader({
  language,
  badgeClass,
  activeCount,
  overdueCount,
}: {
  language: Language;
  badgeClass: string;
  activeCount: number;
  overdueCount: number;
}) {
  return (
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
        <div className="text-base font-semibold leading-tight">
          {LANGUAGE_LABEL[language].full}
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
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={mode === "lend" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("lend")}
      >
        대여
      </Button>
      <Button
        type="button"
        variant={mode === "return" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("return")}
      >
        반납
      </Button>
    </div>
  );
}

function SelectField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ScannedBookPreview({
  book,
  placeholderMode,
}: {
  book: ScannedBook | null;
  placeholderMode: Mode;
}) {
  if (!book) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
        {placeholderMode === "lend"
          ? "대여할 책을 스캔하세요"
          : "반납할 책을 스캔하세요"}
      </div>
    );
  }

  const isKo = book.language === "ko";
  const coverClass = isKo
    ? "bg-ko text-ko-foreground"
    : "bg-en text-en-foreground";

  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
      <div
        className={cn(
          "flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded text-[10px] font-semibold",
          coverClass,
        )}
      >
        {book.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{book.language.toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{book.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {book.author ?? "—"}
          {book.level ? ` · ${book.level}` : ""}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          {book.id}
        </div>
      </div>
    </div>
  );
}

function ActiveLoanList({
  loans,
  mode,
}: {
  loans: ActiveLoan[];
  mode: Mode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        {mode === "lend"
          ? `현재 대여 중 ${loans.length}권`
          : `반납 가능 · 현재 대여 중 ${loans.length}권`}
      </div>
      {loans.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          대여 중인 도서가 없습니다
        </div>
      ) : (
        <ul className="max-h-96 space-y-1 overflow-y-auto">
          {loans.map((loan) => (
            <ActiveLoanItem key={loan.id} loan={loan} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveLoanItem({ loan }: { loan: ActiveLoan }) {
  const days = overdueDays(loan.due_date);
  const isOverdue = days > 0;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border p-3",
        isOverdue && "border-l-4 border-l-destructive bg-destructive/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{loan.student.grade}학년</Badge>
          <span className="font-semibold">{loan.student.name}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {loan.book.title} · 반납 {loan.due_date.slice(5)}
        </div>
      </div>
      {isOverdue ? (
        <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
          +{days}일
        </span>
      ) : null}
    </li>
  );
}
