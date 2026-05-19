"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Trash2, Upload, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { GRADES } from "@/types/domain";

import type { StudentWithStats } from "@/lib/queries/students";

import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentFormDialog } from "./student-form-dialog";
import { StudentsCsvDialog } from "./students-csv-dialog";

type FormDialog =
  | { type: "create" }
  | { type: "edit"; student: StudentWithStats }
  | null;

export function StudentsView({ students }: { students: StudentWithStats[] }) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [formDialog, setFormDialog] = useState<FormDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentWithStats | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim();
    return students.filter((s) => {
      if (q !== "" && !s.name.includes(q)) return false;
      if (gradeFilter !== "all" && String(s.grade) !== gradeFilter) return false;
      if (sectionFilter !== "all" && s.class_section !== sectionFilter)
        return false;
      return true;
    });
  }, [students, search, gradeFilter, sectionFilter]);

  const gradeLabel =
    gradeFilter === "all" ? "전체 학년" : `${gradeFilter}학년`;
  const sectionLabel =
    sectionFilter === "all" ? "전체 반" : sectionFilter;

  const isFiltered = filtered.length !== students.length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            {isFiltered ? (
              <>
                <span className="text-2xl font-bold tabular-nums text-primary">
                  {filtered.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  / 전체 {students.length}명
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold tabular-nums">
                  {students.length}
                </span>
                <span className="text-sm text-muted-foreground">명 학생</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCsvOpen(true)}>
              <Upload className="size-4" />
              CSV 업로드
            </Button>
            <Button onClick={() => setFormDialog({ type: "create" })}>
              <UserPlus className="size-4" />
              학생 추가
            </Button>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이름으로 검색…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={gradeFilter}
              onValueChange={(v) => setGradeFilter(v ?? "all")}
            >
              <SelectTrigger className="w-36">
                <SelectValue>{gradeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 학년</SelectItem>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {g}학년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sectionFilter}
              onValueChange={(v) => setSectionFilter(v ?? "all")}
            >
              <SelectTrigger className="w-36">
                <SelectValue>{sectionLabel}</SelectValue>
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
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">학년</TableHead>
                <TableHead className="w-32">반</TableHead>
                <TableHead>이름</TableHead>
                <TableHead className="w-44">한국어</TableHead>
                <TableHead className="w-44">영어</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {students.length === 0
                      ? "아직 등록된 학생이 없습니다."
                      : "검색 결과가 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Badge variant="secondary">{student.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.class_section}</Badge>
                    </TableCell>
                    <TableCell className="truncate font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <LoanCount
                        active={student.koActive}
                        overdue={student.koOverdue}
                        tone="ko"
                      />
                    </TableCell>
                    <TableCell>
                      <LoanCount
                        active={student.enActive}
                        overdue={student.enOverdue}
                        tone="en"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setFormDialog({ type: "edit", student })
                        }
                        aria-label="수정"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(student)}
                        aria-label="삭제"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {formDialog ? (
        <StudentFormDialog
          mode={formDialog}
          open
          onOpenChange={(open) => {
            if (!open) setFormDialog(null);
          }}
        />
      ) : null}
      <StudentDeleteDialog
        student={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
      {csvOpen ? (
        <StudentsCsvDialog
          open
          onOpenChange={(open) => {
            if (!open) setCsvOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function LoanCount({
  active,
  overdue,
  tone,
}: {
  active: number;
  overdue: number;
  tone: "ko" | "en";
}) {
  if (active === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          tone === "ko"
            ? "font-semibold text-ko"
            : "font-semibold text-en"
        }
      >
        {active}권
      </span>
      {overdue > 0 ? (
        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
          연체 {overdue}
        </span>
      ) : null}
    </div>
  );
}
