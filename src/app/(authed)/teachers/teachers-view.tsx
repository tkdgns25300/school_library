"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Upload, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TeacherDeleteDialog } from "./teacher-delete-dialog";
import { TeacherFormDialog } from "./teacher-form-dialog";
import { TeachersCsvDialog } from "./teachers-csv-dialog";

type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

type FormDialog =
  | { type: "create" }
  | { type: "edit"; teacher: Teacher }
  | null;

export function TeachersView({ teachers }: { teachers: Teacher[] }) {
  const [search, setSearch] = useState("");
  const [formDialog, setFormDialog] = useState<FormDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (q === "") return teachers;
    return teachers.filter((t) => t.name.includes(q));
  }, [teachers, search]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">교사 명단</h2>
          <p className="text-sm text-muted-foreground">
            대여·반납 처리 시 담당자로 선택됩니다 · 총 {teachers.length}명
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="size-4" />
            CSV 업로드
          </Button>
          <Button onClick={() => setFormDialog({ type: "create" })}>
            <UserPlus className="size-4" />
            교사 추가
          </Button>
        </div>
      </div>

      <Input
        placeholder="이름으로 검색…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>담당 반</TableHead>
            <TableHead className="w-32 text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                {teachers.length === 0
                  ? "아직 등록된 교사가 없습니다."
                  : "검색 결과가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">{teacher.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{teacher.class_section}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormDialog({ type: "edit", teacher })}
                    aria-label="수정"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(teacher)}
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
        <TeacherFormDialog
          mode={formDialog}
          open
          onOpenChange={(open) => {
            if (!open) setFormDialog(null);
          }}
        />
      ) : null}
      <TeacherDeleteDialog
        teacher={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
      <TeachersCsvDialog open={csvOpen} onOpenChange={setCsvOpen} />
    </>
  );
}
