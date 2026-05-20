"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarRange, Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import { overdueDays } from "@/lib/date";
import type { HistoryRow } from "@/lib/queries/loan-history";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

type PeriodPreset = "all" | "today" | "this_week" | "this_month" | "last_month";

const PERIOD_PRESETS: ReadonlyArray<{ id: PeriodPreset; label: string }> = [
  { id: "all", label: "전체" },
  { id: "today", label: "오늘" },
  { id: "this_week", label: "이번 주" },
  { id: "this_month", label: "이번 달" },
  { id: "last_month", label: "지난 달" },
];

export function HistoryView({ history }: { history: HistoryRow[] }) {
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [preset, setPreset] = useState<PeriodPreset>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const activeRange = useMemo(
    () => (customRange?.from ? customRange : presetToRange(preset)),
    [preset, customRange],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromStr = activeRange?.from
      ? format(activeRange.from, "yyyy-MM-dd")
      : null;
    // 사용자가 단일 일자만 클릭한 경우(to 미지정) from을 상한으로도 사용해
    // 트리거 라벨(「YYYY-MM-DD」)과 실제 필터(그 날짜만) 의미를 일치시킨다.
    const toStr = activeRange?.to
      ? format(activeRange.to, "yyyy-MM-dd")
      : fromStr;
    return history.filter((h) => {
      const returned = h.returned_at.slice(0, 10);
      if (fromStr && returned < fromStr) return false;
      if (toStr && returned > toStr) return false;
      if (languageFilter !== "all" && h.book.language !== languageFilter)
        return false;
      if (sectionFilter !== "all" && h.student.class_section !== sectionFilter)
        return false;
      if (q !== "") {
        const matches =
          h.student.name.includes(search.trim()) ||
          h.book.title.toLowerCase().includes(q) ||
          h.book.id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [history, search, languageFilter, sectionFilter, activeRange]);

  const isFiltered = filtered.length !== history.length;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-1.5">
        {isFiltered ? (
          <>
            <span className="text-2xl font-bold tabular-nums text-primary">
              {filtered.length}
            </span>
            <span className="text-sm text-muted-foreground">
              / 전체 {history.length}건
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold tabular-nums">
              {history.length}
            </span>
            <span className="text-sm text-muted-foreground">건 반납</span>
          </>
        )}
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
        <PeriodFilter
          preset={preset}
          customRange={customRange}
          onPresetChange={(p) => {
            setPreset(p);
            setCustomRange(undefined);
          }}
          onCustomRangeChange={(r) => {
            setCustomRange(r);
            setPreset("all");
          }}
        />
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

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <Table className="min-w-[780px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">표지</TableHead>
              <TableHead className="w-40">학생</TableHead>
              <TableHead>책</TableHead>
              <TableHead className="w-16">언어</TableHead>
              <TableHead className="w-28">대여일</TableHead>
              <TableHead className="w-32">반납일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {history.length === 0
                    ? "반납 완료된 대여가 없습니다."
                    : "검색 결과가 없습니다."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => <HistoryRowItem key={row.id} row={row} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PeriodFilter({
  preset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
}: {
  preset: PeriodPreset;
  customRange: DateRange | undefined;
  onPresetChange: (p: PeriodPreset) => void;
  onCustomRangeChange: (r: DateRange | undefined) => void;
}) {
  const from = customRange?.from;
  const to = customRange?.to;
  const hasCustom = from !== undefined;
  const isFiltered = preset !== "all" || hasCustom;
  const label = hasCustom
    ? to && format(to, "yyyy-MM-dd") !== format(from, "yyyy-MM-dd")
      ? `${format(from, "MM.dd")} ~ ${format(to, "MM.dd")}`
      : format(from, "yyyy-MM-dd")
    : (PERIOD_PRESETS.find((p) => p.id === preset)?.label ?? "기간");

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "gap-2 font-medium",
          isFiltered && "border-primary text-primary",
        )}
      >
        <CalendarRange className="size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex w-32 flex-col gap-0.5 border-r p-2">
            {PERIOD_PRESETS.map((p) => {
              const isActive = !hasCustom && preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPresetChange(p.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={onCustomRangeChange}
              numberOfMonths={1}
            />
            {hasCustom ? (
              <div className="flex justify-end border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCustomRangeChange(undefined)}
                >
                  지우기
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
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

function HistoryRowItem({ row }: { row: HistoryRow }) {
  const isKo = row.book.language === "ko";
  const returnedDate = row.returned_at.slice(0, 10);
  const lateDays = overdueDays(row.due_date, returnedDate);

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <div
          className={cn(
            "flex h-14 w-10 items-center justify-center overflow-hidden rounded-md text-[10px] font-semibold",
            isKo ? "bg-ko text-ko-foreground" : "bg-en text-en-foreground",
          )}
        >
          {row.book.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.book.cover_image_url}
              alt={row.book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="uppercase">{row.book.language}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="truncate font-medium">{row.student.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {row.student.grade}학년 · {row.student.class_section}
        </div>
      </TableCell>
      <TableCell>
        <div className="truncate font-medium">{row.book.title}</div>
        <div className="flex gap-2 truncate text-xs text-muted-foreground">
          <span className="font-mono">{row.book.id}</span>
          {row.book.author ? <span>· {row.book.author}</span> : null}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isKo ? "bg-ko text-ko-foreground" : "bg-en text-en-foreground",
          )}
        >
          {LANGUAGE_LABEL[row.book.language as Language]?.short ??
            row.book.language.toUpperCase()}
        </span>
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">
        {row.loaned_at.slice(0, 10)}
      </TableCell>
      <TableCell>
        <div className="font-mono text-sm">{returnedDate}</div>
        {lateDays > 0 ? (
          <span className="mt-1 inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
            +{lateDays}일 연체
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

function presetToRange(preset: PeriodPreset): DateRange | undefined {
  if (preset === "all") return undefined;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "today") return { from: today, to: today };
  if (preset === "this_week") {
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    return { from: monday, to: today };
  }
  if (preset === "this_month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: first, to: today };
  }
  // last_month
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );
  const lastOfLastMonth = new Date(firstOfThisMonth);
  lastOfLastMonth.setDate(lastOfLastMonth.getDate() - 1);
  return { from: firstOfLastMonth, to: lastOfLastMonth };
}
