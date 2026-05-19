"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { LANGUAGE_LABEL } from "@/constants/languages";
import { todayIso } from "@/lib/date";
import type { LoanRow } from "@/lib/queries/loans";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

import { LoanDetailDialog } from "./loan-detail-dialog";

type Teacher = { id: string; name: string };

function overdueDays(dueDate: string): number {
  const today = todayIso();
  if (dueDate >= today) return 0;
  return Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86_400_000);
}

export function LoansView({
  loans,
  teachers,
  totalActive,
  overdueCount,
  maxOverdueDays,
  dueTodayCount,
}: {
  loans: LoanRow[];
  teachers: Teacher[];
  totalActive: number;
  overdueCount: number;
  maxOverdueDays: number;
  dueTodayCount: number;
}) {
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [selectedLoan, setSelectedLoan] = useState<LoanRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((l) => {
      if (
        languageFilter !== "all" &&
        l.book.language !== languageFilter
      )
        return false;
      if (
        sectionFilter !== "all" &&
        l.student.class_section !== sectionFilter
      )
        return false;
      if (q !== "") {
        const matches =
          l.student.name.includes(search.trim()) ||
          l.book.title.toLowerCase().includes(q) ||
          l.book.id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [loans, search, languageFilter, sectionFilter]);

  const activeCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of loans) {
      map.set(l.student.id, (map.get(l.student.id) ?? 0) + 1);
    }
    return map;
  }, [loans]);

  const otherActiveCount = selectedLoan
    ? (activeCountByStudent.get(selectedLoan.student.id) ?? 1) - 1
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="전체 대여 중" value={totalActive} unit="권" />
        <KpiCard
          label="연체"
          value={overdueCount}
          unit="권"
          extra={overdueCount > 0 ? `최장 ${maxOverdueDays}일` : undefined}
          tone="alert"
        />
        <KpiCard
          label="오늘 반납 예정"
          value={dueTodayCount}
          unit="권"
          tone="warn"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="학생·책 제목·바코드로 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <LanguageToggle value={languageFilter} onChange={setLanguageFilter} />
        <Select
          value={sectionFilter}
          onValueChange={(v) => setSectionFilter(v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              {sectionFilter === "all" ? "전체 반" : sectionFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 반</SelectItem>
            {CLASS_SECTIONS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">표지</TableHead>
              <TableHead className="w-28">학년·반</TableHead>
              <TableHead className="w-28">학생</TableHead>
              <TableHead>책</TableHead>
              <TableHead className="w-16">언어</TableHead>
              <TableHead className="w-28">반납 예정</TableHead>
              <TableHead className="w-32">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  {loans.length === 0
                    ? "활성 대여가 없습니다."
                    : "검색 결과가 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((loan) => (
                <LoanRowItem
                  key={loan.id}
                  loan={loan}
                  onClick={() => setSelectedLoan(loan)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LoanDetailDialog
        loan={selectedLoan}
        teachers={teachers}
        otherActiveCount={otherActiveCount}
        open={selectedLoan !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLoan(null);
        }}
      />
    </div>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { v: "all", label: "전체" },
    { v: "ko", label: "한국어" },
    { v: "en", label: "영어" },
  ];
  return (
    <div className="inline-flex overflow-hidden rounded-md border bg-card">
      {options.map(({ v, label }, idx) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors",
            idx > 0 && "border-l",
            value === v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/60",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  extra,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  extra?: string;
  tone?: "alert" | "warn";
}) {
  const valueClass = cn(
    "text-3xl font-bold tabular-nums",
    tone === "alert" && value > 0 && "text-destructive",
    tone === "warn" && value > 0 && "text-amber-600 dark:text-amber-500",
  );
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className={valueClass}>{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        {extra ? (
          <div className="mt-1 text-xs text-muted-foreground">{extra}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LoanRowItem({
  loan,
  onClick,
}: {
  loan: LoanRow;
  onClick: () => void;
}) {
  const today = todayIso();
  const days = overdueDays(loan.due_date);
  const isOverdue = days > 0;
  const isDueToday = loan.due_date === today;
  const isKo = loan.book.language === "ko";

  return (
    <TableRow
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <TableCell>
        <div
          className={cn(
            "flex h-14 w-10 items-center justify-center overflow-hidden rounded-md text-[10px] font-semibold",
            isKo ? "bg-ko text-ko-foreground" : "bg-en text-en-foreground",
          )}
        >
          {loan.book.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loan.book.cover_image_url}
              alt={loan.book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="uppercase">{loan.book.language}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge variant="secondary">{loan.student.grade}학년</Badge>
          <Badge variant="outline" className="font-normal">
            {loan.student.class_section}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="truncate font-medium">{loan.student.name}</TableCell>
      <TableCell>
        <div className="truncate font-medium">{loan.book.title}</div>
        <div className="flex gap-2 truncate text-xs text-muted-foreground">
          <span className="font-mono">{loan.book.id}</span>
          {loan.book.author ? <span>· {loan.book.author}</span> : null}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isKo ? "bg-ko text-ko-foreground" : "bg-en text-en-foreground",
          )}
        >
          {LANGUAGE_LABEL[loan.book.language as Language]?.short ??
            loan.book.language.toUpperCase()}
        </span>
      </TableCell>
      <TableCell
        className={cn(
          "font-mono text-sm",
          isOverdue && "font-semibold text-destructive",
        )}
      >
        {loan.due_date}
      </TableCell>
      <TableCell>
        {isOverdue ? (
          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
            +{days}일 연체
          </span>
        ) : isDueToday ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            오늘 반납
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">대여 중</span>
        )}
      </TableCell>
    </TableRow>
  );
}
