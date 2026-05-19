"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Trash2, Upload, UserPlus } from "lucide-react";

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

  const isFiltered = filtered.length !== teachers.length;

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
                  / 전체 {teachers.length}명
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold tabular-nums">
                  {teachers.length}
                </span>
                <span className="text-sm text-muted-foreground">명 교사</span>
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
              교사 추가
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름으로 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table className="min-w-[480px] table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>이름</TableHead>
                <TableHead className="w-48">담당 반</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {teachers.length === 0
                      ? "아직 등록된 교사가 없습니다."
                      : "검색 결과가 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                          {teacher.name.slice(0, 1)}
                        </span>
                        <span className="truncate font-medium">
                          {teacher.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{teacher.class_section}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setFormDialog({ type: "edit", teacher })
                        }
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
        </div>
      </div>

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
      {csvOpen ? (
        <TeachersCsvDialog
          open
          onOpenChange={(open) => {
            if (!open) setCsvOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
