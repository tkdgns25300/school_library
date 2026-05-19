"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Barcode,
  Calendar as CalendarIcon,
  Loader2,
  ScanLine,
  X,
  XCircle,
} from "lucide-react";
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
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { LANGUAGE_LABEL } from "@/constants/languages";
import { overdueDays, todayIso } from "@/lib/date";
import type { ActiveLoan, Student } from "@/lib/queries/operation";
import { cn } from "@/lib/utils";
import type { ClassSection, Language } from "@/types/domain";

import { lendBook, returnBook } from "./actions";

const DEFAULT_DUE_DAYS = 7;
const SCAN_FEEDBACK_MS = 1500;

type Mode = "lend" | "return";

type ScanFeedback = { kind: "error"; message: string; bookId: string };

export function LanguageColumn({
  language,
  section,
  students,
  loans,
}: {
  language: Language;
  section: ClassSection;
  students: Student[];
  loans: ActiveLoan[];
}) {
  const sectionGrades = useMemo(
    () => CLASS_SECTIONS.find((s) => s.id === section)?.grades ?? [],
    [section],
  );

  const [mode, setMode] = useState<Mode>("lend");
  const [student, setStudent] = useState<Student | null>(null);
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_DUE_DAYS);
    return d;
  });
  const [barcode, setBarcode] = useState<string>("");
  const [scanning, startScan] = useTransition();
  const [scanGuideOpen, setScanGuideOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  // Bump on each scan-overlay open to force-remount the barcode input.
  // setBarcode("") alone is insufficient if an IME composition is in
  // flight (the DOM keeps the half-typed character even after state is
  // cleared), and the leftover ends up prepended to the next scan.
  const [barcodeKey, setBarcodeKey] = useState(0);
  const barcodeRef = useRef<HTMLInputElement>(null);

  function focusBarcode() {
    const input = barcodeRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }

  function openScanGuide() {
    if (mode === "lend" && !student) {
      toast.error("학생을 먼저 선택해주세요");
      return;
    }
    // Tear down any in-flight IME composition and reset the input fully
    // so the next scan starts from a clean DOM/state pair (BBK00001 bug).
    barcodeRef.current?.blur();
    setBarcode("");
    setBarcodeKey((k) => k + 1);
    setScanGuideOpen(true);
  }

  function closeScanGuide() {
    setScanGuideOpen(false);
    focusBarcode();
  }

  useEffect(() => {
    if (!scanGuideOpen) return;
    requestAnimationFrame(() => {
      const input = barcodeRef.current;
      if (!input) return;
      input.focus();
      input.select();
    });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setScanGuideOpen(false);
        requestAnimationFrame(() => barcodeRef.current?.focus());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scanGuideOpen]);

  // After each scan transition finishes (success or failure), restore focus
  // to the barcode input — the input is disabled while `scanning`, which
  // drops focus, and we need it back so the next scan lands correctly.
  const prevScanningRef = useRef(scanning);
  useEffect(() => {
    if (prevScanningRef.current && !scanning) {
      requestAnimationFrame(focusBarcode);
    }
    prevScanningRef.current = scanning;
  }, [scanning]);

  // Clear the success/error banner after a short hold so the overlay
  // returns to the ready state and the operator can scan the next book.
  useEffect(() => {
    if (!scanFeedback) return;
    const timer = setTimeout(() => setScanFeedback(null), SCAN_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [scanFeedback]);

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

      const pickedStudent = student;
      setScanFeedback(null);
      startScan(async () => {
        const result = await lendBook({
          section,
          language,
          bookId: value,
          studentId: pickedStudent.id,
          dueDate: format(dueDate, "yyyy-MM-dd"),
        });
        setBarcode("");
        if (result.error) {
          setScanFeedback({
            kind: "error",
            message: result.error,
            bookId: value,
          });
          return;
        }
        setScanGuideOpen(false);
        toast.success(
          `${pickedStudent.grade}학년 ${pickedStudent.name} — '${result.book?.title ?? value}' 대여 완료`,
        );
      });
      return;
    }

    setScanFeedback(null);
    startScan(async () => {
      const result = await returnBook({
        section,
        language,
        bookId: value,
      });
      setBarcode("");
      if (result.error) {
        setScanFeedback({
          kind: "error",
          message: result.error,
          bookId: value,
        });
        return;
      }
      setScanGuideOpen(false);
      const who = result.borrower
        ? `${result.borrower.grade}학년 ${result.borrower.name} — `
        : "";
      toast.success(
        `${who}'${result.book?.title ?? value}' 반납 완료`,
      );
    });
  }

  function handleListReturn(loan: ActiveLoan) {
    setScanFeedback(null);
    startScan(async () => {
      const result = await returnBook({
        section,
        language,
        bookId: loan.book.id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const who = result.borrower
        ? `${result.borrower.grade}학년 ${result.borrower.name} — `
        : `${loan.student.grade}학년 ${loan.student.name} — `;
      toast.success(
        `${who}'${result.book?.title ?? loan.book.title}' 반납 완료`,
      );
    });
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      setBarcode((prev) => prev.slice(0, -1));
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Capture by physical key position (e.code) so the value is unaffected
    // by the current IME state. With Korean IME active 'B' (=ㅠ) and 'K'
    // (=ㅏ) form an invalid syllable and the IME silently drops them,
    // leaving only the digits — so we can't rely on e.key or onChange.
    let ch: string | null = null;
    if (e.code.startsWith("Key") && e.code.length === 4) {
      ch = e.code.charAt(3);
    } else if (e.code.startsWith("Digit") && e.code.length === 6) {
      ch = e.code.charAt(5);
    } else if (e.code.startsWith("Numpad") && e.code.length === 7) {
      const c = e.code.charAt(6);
      if (c >= "0" && c <= "9") ch = c;
    }
    if (ch === null) return;
    e.preventDefault();
    setBarcode((prev) => prev + ch);
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <ColumnHeader
        language={language}
        badgeClass={badgeClass}
        activeCount={loans.length}
        overdueCount={overdueLoans.length}
      />

      <ModeTabs mode={mode} onChange={setMode} language={language} />

      <div className="space-y-7 bg-muted/15 px-6 py-8">
        {mode === "lend" ? (
          <>
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  학생
                </Label>
                {student ? (
                  <span className="text-xs font-semibold text-foreground">
                    {student.grade}학년 {student.name}
                  </span>
                ) : null}
              </div>
              <StudentPicker
                students={students}
                sectionGrades={sectionGrades}
                value={student}
                onChange={setStudent}
                disabled={scanning}
                language={language}
              />
            </div>

            <SelectField label="반납 예정일">
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-12 w-full justify-start gap-2 text-base font-normal",
                  )}
                  disabled={scanning}
                >
                  <CalendarIcon className="size-5 text-muted-foreground" />
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
          </>
        ) : null}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              key={barcodeKey}
              ref={barcodeRef}
              value={barcode}
              readOnly
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
            onClick={openScanGuide}
            disabled={scanning}
            className="h-12 px-5"
          >
            <ScanLine className="size-4" />
            스캔
          </Button>
        </div>

      </div>

      <ActiveLoanList
        loans={loans}
        mode={mode}
        today={today}
        onReturn={handleListReturn}
        processing={scanning}
      />

      {scanGuideOpen ? (
        <ScanGuideOverlay
          scanning={scanning}
          feedback={scanFeedback}
          onClose={closeScanGuide}
        />
      ) : null}
    </div>
  );
}

function ScanGuideOverlay({
  scanning,
  feedback,
  onClose,
}: {
  scanning: boolean;
  feedback: ScanFeedback | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="바코드 스캔"
      onMouseDown={(e) => {
        // Keep focus on the barcode input even while the overlay is open.
        e.preventDefault();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <ScanOverlayBody scanning={scanning} feedback={feedback} />
      </div>
    </div>
  );
}

function ScanOverlayBody({
  scanning,
  feedback,
}: {
  scanning: boolean;
  feedback: ScanFeedback | null;
}) {
  if (scanning) {
    return (
      <div className="flex flex-col items-center gap-6 px-10 pb-12 pt-14 text-center">
        <div className="flex size-28 items-center justify-center rounded-full bg-muted/40">
          <Loader2 className="size-16 animate-spin text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold">처리 중…</h3>
      </div>
    );
  }

  if (feedback?.kind === "error") {
    return (
      <div className="flex flex-col items-center gap-6 px-10 pb-10 pt-12 text-center">
        <div className="flex size-28 items-center justify-center rounded-full bg-destructive/12 ring-8 ring-destructive/25">
          <XCircle className="size-16 text-destructive" strokeWidth={2.2} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-destructive">
            {feedback.message}
          </h3>
          <p className="font-mono text-sm text-muted-foreground">
            {feedback.bookId}
          </p>
        </div>
      </div>
    );
  }

  // ready — vermilion-tinted scan icon, single line copy.
  return (
    <div className="flex flex-col items-center gap-7 px-10 pb-12 pt-14 text-center">
      <div className="relative flex size-28 items-center justify-center rounded-full bg-orange-100 ring-8 ring-orange-200/60">
        <ScanLine className="size-16 text-orange-500" strokeWidth={2.2} />
        <span className="absolute inset-0 animate-ping rounded-full bg-orange-300/40" />
      </div>
      <h3 className="text-2xl font-bold tracking-tight">바코드를 스캔하세요</h3>
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
  const isKo = language === "ko";
  const headerBg = isKo
    ? "bg-gradient-to-br from-ko/12 via-ko/5 to-transparent"
    : "bg-gradient-to-br from-en/12 via-en/5 to-transparent";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-5",
        headerBg,
      )}
    >
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

function ModeTabs({
  mode,
  onChange,
  language,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  language: Language;
}) {
  const isKo = language === "ko";
  const activeTextClass = isKo ? "text-ko" : "text-en";
  const activeBarClass = isKo ? "bg-ko" : "bg-en";

  const tabs: ReadonlyArray<{ id: Mode; label: string }> = [
    { id: "lend", label: "대여" },
    { id: "return", label: "반납" },
  ];

  return (
    <div className="grid grid-cols-2 border-y">
      {tabs.map((tab) => {
        const isActive = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-3.5 text-base font-semibold transition-colors",
              isActive
                ? activeTextClass
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            {tab.label}
            {isActive ? (
              <span
                className={cn(
                  "absolute inset-x-4 -bottom-px h-0.5 rounded-full",
                  activeBarClass,
                )}
              />
            ) : null}
          </button>
        );
      })}
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
    <div className="space-y-2.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function StudentPicker({
  students,
  sectionGrades,
  value,
  onChange,
  disabled,
  language,
}: {
  students: Student[];
  sectionGrades: ReadonlyArray<number>;
  value: Student | null;
  onChange: (s: Student) => void;
  disabled?: boolean;
  language: Language;
}) {
  const studentsByGrade = useMemo(() => {
    const map = new Map<number, Student[]>();
    for (const g of sectionGrades) map.set(g, []);
    for (const s of students) {
      const list = map.get(s.grade);
      if (list) list.push(s);
    }
    return map;
  }, [students, sectionGrades]);

  const [activeGrade, setActiveGrade] = useState<number>(
    () => value?.grade ?? sectionGrades[0] ?? 0,
  );

  const activeStudents = studentsByGrade.get(activeGrade) ?? [];
  const isKo = language === "ko";
  const activeUnderlineClass = isKo ? "text-ko" : "text-en";
  const activeUnderlineBar = isKo ? "bg-ko" : "bg-en";
  const selectedChipClass = isKo
    ? "border-ko bg-ko text-ko-foreground hover:bg-ko/90"
    : "border-en bg-en text-en-foreground hover:bg-en/90";

  return (
    <div className="space-y-4">
      <div className="flex border-b">
        {sectionGrades.map((g) => {
          const count = studentsByGrade.get(g)?.length ?? 0;
          const isActive = activeGrade === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGrade(g)}
              disabled={disabled}
              className={cn(
                "relative inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                isActive
                  ? activeUnderlineClass
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{g}학년</span>
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? cn("bg-current text-background opacity-90")
                    : "bg-muted text-muted-foreground/80",
                )}
              >
                {count}
              </span>
              {isActive ? (
                <span
                  className={cn(
                    "absolute inset-x-6 -bottom-px h-0.5 rounded-full",
                    activeUnderlineBar,
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      {activeStudents.length === 0 ? (
        <div className="py-2 text-xs text-muted-foreground">
          {activeGrade}학년에 학생이 없습니다
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {activeStudents.map((s) => {
            const isSelected = value?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange(s)}
                disabled={disabled}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-50",
                  isSelected
                    ? selectedChipClass
                    : "border-border bg-background text-foreground hover:bg-muted/60",
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActiveLoanList({
  loans,
  mode,
  today,
  onReturn,
  processing,
}: {
  loans: ActiveLoan[];
  mode: Mode;
  today: string;
  onReturn: (loan: ActiveLoan) => void;
  processing: boolean;
}) {
  const isReturn = mode === "return";
  return (
    <div>
      <div className="px-6 py-3 text-xs font-medium text-muted-foreground">
        {isReturn ? "반납 가능 · " : ""}현재 대여 중 {loans.length}권
      </div>
      {loans.length === 0 ? (
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          대여 중인 도서가 없습니다
        </div>
      ) : (
        <ul className="max-h-96 divide-y overflow-y-auto">
          {loans.map((loan) => (
            <ActiveLoanItem
              key={loan.id}
              loan={loan}
              today={today}
              showReturnButton={isReturn}
              onReturn={onReturn}
              processing={processing}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveLoanItem({
  loan,
  today,
  showReturnButton,
  onReturn,
  processing,
}: {
  loan: ActiveLoan;
  today: string;
  showReturnButton: boolean;
  onReturn: (loan: ActiveLoan) => void;
  processing: boolean;
}) {
  const days = overdueDays(loan.due_date, today);
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
          {isOverdue ? (
            <span className="text-xs font-semibold text-destructive">
              +{days}일 연체
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {loan.book.title} · 반납 {loan.due_date.slice(5)}
        </div>
      </div>
      {showReturnButton ? (
        <button
          type="button"
          onClick={() => onReturn(loan)}
          disabled={processing}
          className="shrink-0 rounded-md border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          반납
        </button>
      ) : null}
    </li>
  );
}
