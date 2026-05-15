"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Upload, UserPlus } from "lucide-react";

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

import { StudentDeleteDialog } from "./student-delete-dialog";
import { StudentFormDialog } from "./student-form-dialog";
import { StudentsCsvDialog } from "./students-csv-dialog";

type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

type FormDialog =
  | { type: "create" }
  | { type: "edit"; student: Student }
  | null;

export function StudentsView({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [formDialog, setFormDialog] = useState<FormDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
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

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">학생 명단</h2>
          <p className="text-sm text-muted-foreground">
            전체 {students.length}명 · 학년·반 순으로 정렬
          </p>
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

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="이름으로 검색…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={gradeFilter}
          onValueChange={(v) => setGradeFilter(v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
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
            <SelectValue />
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>학년</TableHead>
            <TableHead>반</TableHead>
            <TableHead>이름</TableHead>
            <TableHead>한국어 (대여 / 연체)</TableHead>
            <TableHead>영어 (대여 / 연체)</TableHead>
            <TableHead className="w-32 text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
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
                  <Badge variant="secondary">{student.grade}학년</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{student.class_section}</Badge>
                </TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormDialog({ type: "edit", student })}
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
