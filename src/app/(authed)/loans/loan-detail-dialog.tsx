"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

import { returnLoanById } from "./actions";
import type { LoanRow } from "./loans-view";

type Teacher = { id: string; name: string };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LoanDetailDialog({
  loan,
  teachers,
  otherActiveCount,
  open,
  onOpenChange,
}: {
  loan: LoanRow | null;
  teachers: Teacher[];
  otherActiveCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [teacherId, setTeacherId] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setTeacherId(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loan?.id]);

  if (!loan) return null;

  const lang = (loan.book.language === "en" ? "en" : "ko") as Language;
  const isKo = lang === "ko";
  const today = todayIso();
  const isOverdue = loan.due_date < today;
  const overdueDays = isOverdue
    ? Math.floor(
        (Date.parse(today) - Date.parse(loan.due_date)) / 86_400_000,
      )
    : 0;

  function handleReturn() {
    if (!loan) return;
    if (!teacherId) {
      toast.error("담당 교사를 선택해주세요");
      return;
    }
    startTransition(async () => {
      const result = await returnLoanById({
        loanId: loan.id,
        teacherId,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`'${loan.book.title}' 반납 완료`);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>대여 상세</DialogTitle>
          <DialogDescription>{loan.book.title}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 rounded-lg border bg-card p-4">
          <div
            className={cn(
              "flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-semibold",
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
          <div className="min-w-0 flex-1 space-y-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                isKo
                  ? "bg-ko text-ko-foreground"
                  : "bg-en text-en-foreground",
              )}
            >
              {loan.book.language}
            </span>
            <div className="text-base font-semibold leading-tight">
              {loan.book.title}
            </div>
            {loan.book.author ? (
              <div className="text-sm text-muted-foreground">
                {loan.book.author}
              </div>
            ) : null}
            <div className="pt-1 font-mono text-xs text-muted-foreground">
              {loan.book.id}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{loan.student.grade}학년</Badge>
            <Badge variant="outline">{loan.student.class_section}</Badge>
            <span className="text-base font-semibold">
              {loan.student.name}
            </span>
          </div>
          {otherActiveCount > 0 ? (
            <div className="mt-2 text-xs text-muted-foreground">
              이 학생은 다른 책{" "}
              <span className="font-semibold text-foreground">
                {otherActiveCount}권
              </span>
              도 대여 중
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <InfoBox label="대여일" value={loan.loaned_at.slice(0, 10)} />
          <InfoBox
            label="반납 예정"
            value={loan.due_date}
            extra={isOverdue ? `${overdueDays}일 연체` : undefined}
            tone={isOverdue ? "alert" : undefined}
          />
          <InfoBox label="언어" value={loan.book.language.toUpperCase()} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            반납 담당 교사
          </Label>
          <Select
            value={teacherId}
            onValueChange={(v) => setTeacherId(v ?? undefined)}
            disabled={pending}
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            닫기
          </Button>
          <Button type="button" onClick={handleReturn} disabled={pending}>
            {pending ? "처리 중…" : "반납 처리"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoBox({
  label,
  value,
  extra,
  tone,
}: {
  label: string;
  value: string;
  extra?: string;
  tone?: "alert";
}) {
  return (
    <div className="rounded-md border bg-card p-3 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono font-semibold",
          tone === "alert" && "text-destructive",
        )}
      >
        {value}
      </div>
      {extra ? (
        <div
          className={cn(
            "mt-0.5 text-xs",
            tone === "alert"
              ? "font-semibold text-destructive"
              : "text-muted-foreground",
          )}
        >
          {extra}
        </div>
      ) : null}
    </div>
  );
}
