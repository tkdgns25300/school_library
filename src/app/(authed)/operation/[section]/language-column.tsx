"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Barcode, Calendar as CalendarIcon, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
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
  const badgeClass = isKo
    ? "bg-ko text-ko-foreground"
    : "bg-en text-en-foreground";

  const today = todayIso();
  const overdueLoans = loans.filter((l) => l.due_date < today);

  function handleScan() {
    const value = barcode.trim();
    if (value === "") return;

    if (mode === "lend") {
      if (!student) {
        toast.error("학생을 먼저 선택해주세요");
        return;
      }
      if (!teacher) {
        toast.error("담당 교사를 먼저 선택해주세요");
        return;
      }

      startScan(async () => {
        const result = await lendBook({
          section,
          language,
          bookId: value,
          studentId: student.id,
          teacherId: teacher.id,
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

    if (!teacher) {
      toast.error("담당 교사를 먼저 선택해주세요");
      return;
    }
    startScan(async () => {
      const result = await returnBook({
        section,
        language,
        bookId: value,
        teacherId: teacher.id,
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
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <ColumnHeader
        language={language}
        badgeClass={badgeClass}
        activeCount={loans.length}
        overdueCount={overdueLoans.length}
      />

      <div className="space-y-4 border-y bg-muted/15 px-6 py-5">
        <ModeToggle mode={mode} onChange={setMode} language={language} />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SelectField label="학생">
            <Combobox
              items={students}
              itemToStringLabel={(s: Student) => `${s.grade}학년 ${s.name}`}
              value={student}
              onValueChange={(s) => setStudent(s as Student | null)}
              disabled={scanning}
            >
              <ComboboxInput placeholder="학생 선택 또는 검색" />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxCollection>
                    {(s: Student) => (
                      <ComboboxItem key={s.id} value={s}>
                        {s.grade}학년 {s.name}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                  <ComboboxEmpty>일치하는 학생이 없습니다</ComboboxEmpty>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
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
          <Combobox
            items={teachers}
            itemToStringLabel={(t: Teacher) => t.name}
            value={teacher}
            onValueChange={(t) => setTeacher(t as Teacher | null)}
            disabled={scanning}
          >
            <ComboboxInput placeholder="교사 선택 또는 검색" />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxCollection>
                  {(t: Teacher) => (
                    <ComboboxItem key={t.id} value={t}>
                      {t.name}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                <ComboboxEmpty>일치하는 교사가 없습니다</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </SelectField>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="BK00001"
              autoFocus
              disabled={scanning}
              className="h-12 pl-10 font-mono text-base tracking-wider"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => barcodeRef.current?.focus()}
            disabled={scanning}
            className="h-12 px-5"
          >
            <ScanLine className="size-4" />
            스캔
          </Button>
        </div>

        {lastBook ? <ScannedBookPreview book={lastBook} /> : null}
      </div>

      <ActiveLoanList loans={loans} mode={mode} />
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
    <div className="flex items-center justify-between gap-4 px-6 py-5">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-8 shrink-0 items-center rounded-md px-2.5 text-xs font-bold uppercase tracking-wider",
            badgeClass,
          )}
        >
          {LANGUAGE_LABEL[language].short}
        </span>
        <h3 className="text-xl font-semibold leading-tight">
          {LANGUAGE_LABEL[language].full}
        </h3>
      </div>
      <div className="text-right">
        <div className="flex items-baseline justify-end gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{activeCount}</span>
          <span className="text-sm text-muted-foreground">권 대여</span>
        </div>
        {overdueCount > 0 ? (
          <div className="mt-0.5 text-sm font-semibold text-destructive">
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
  language,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  language: Language;
}) {
  const filledClass =
    language === "ko"
      ? "bg-ko text-ko-foreground hover:bg-ko/90"
      : "bg-en text-en-foreground hover:bg-en/90";

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={mode === "lend" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("lend")}
        className={cn("min-w-16", mode === "lend" && filledClass)}
      >
        대여
      </Button>
      <Button
        type="button"
        variant={mode === "return" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("return")}
        className={cn("min-w-16", mode === "return" && filledClass)}
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

function ScannedBookPreview({ book }: { book: ScannedBook }) {
  const isKo = book.language === "ko";
  const coverClass = isKo
    ? "bg-ko text-ko-foreground"
    : "bg-en text-en-foreground";

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-3">
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
    <div>
      <div className="px-6 py-3 text-xs font-medium text-muted-foreground">
        {mode === "return" ? "반납 가능 · " : ""}현재 대여 중 {loans.length}권
      </div>
      {loans.length === 0 ? (
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          대여 중인 도서가 없습니다
        </div>
      ) : (
        <ul className="max-h-96 divide-y overflow-y-auto">
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
        "flex items-center gap-3 border-l-2 px-6 py-3 transition-colors",
        isOverdue
          ? "border-l-destructive bg-destructive/5"
          : "border-l-transparent hover:bg-muted/30",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge>{loan.student.grade}학년</Badge>
          <span className="font-semibold">{loan.student.name}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {loan.book.title} · 반납 {loan.due_date.slice(5)}
        </div>
      </div>
      {isOverdue ? (
        <span className="shrink-0 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          +{days}일
        </span>
      ) : null}
    </li>
  );
}
