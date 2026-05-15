"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LANGUAGE_LABEL } from "@/constants/languages";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

export type LoanRow = {
  id: string;
  loaned_at: string;
  due_date: string;
  student: {
    id: string;
    name: string;
    grade: number;
    class_section: string;
  };
  book: {
    id: string;
    title: string;
    author: string | null;
    language: string;
    cover_image_url: string | null;
  };
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function overdueDays(dueDate: string): number {
  const today = todayIso();
  if (dueDate >= today) return 0;
  return Math.floor((Date.parse(today) - Date.parse(dueDate)) / 86_400_000);
}

export function LoansView({
  loans,
  totalActive,
  overdueCount,
  maxOverdueDays,
  dueTodayCount,
}: {
  loans: LoanRow[];
  totalActive: number;
  overdueCount: number;
  maxOverdueDays: number;
  dueTodayCount: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">대여 현황</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          모든 활성 대여 · 회수 우선순위 (연체 → 저학년 → 기한 순)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="전체 대여 중" value={totalActive} unit="권" />
        <KpiCard
          label="연체"
          value={overdueCount}
          unit="권"
          extra={overdueCount > 0 ? `최장 ${maxOverdueDays}일` : undefined}
          tone="alert"
        />
        <KpiCard label="오늘 반납 예정" value={dueTodayCount} unit="권" />
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
            {loans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  활성 대여가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan) => <LoanRowItem key={loan.id} loan={loan} />)
            )}
          </TableBody>
        </Table>
      </div>
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
  tone?: "alert";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span
            className={cn(
              "text-3xl font-bold",
              tone === "alert" && value > 0 && "text-destructive",
            )}
          >
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        {extra ? (
          <div className="mt-1 text-xs text-muted-foreground">{extra}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LoanRowItem({ loan }: { loan: LoanRow }) {
  const today = todayIso();
  const days = overdueDays(loan.due_date);
  const isOverdue = days > 0;
  const isDueToday = loan.due_date === today;
  const isKo = loan.book.language === "ko";

  return (
    <TableRow>
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
