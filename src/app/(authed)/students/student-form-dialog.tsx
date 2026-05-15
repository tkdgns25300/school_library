"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CLASS_SECTIONS,
  isValidGradeClassSection,
} from "@/constants/class-sections";
import { GRADES } from "@/types/domain";
import type { ClassSection, Grade } from "@/types/domain";

import {
  createStudent,
  updateStudent,
  type StudentFormState,
} from "./actions";

type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

type Mode = { type: "create" } | { type: "edit"; student: Student };

const INITIAL_STATE: StudentFormState = {};

export function StudentFormDialog({
  mode,
  open,
  onOpenChange,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = mode.type === "edit";
  const action = isEdit ? updateStudent : createStudent;
  const [state, formAction, pending] = useActionState<
    StudentFormState,
    FormData
  >(action, INITIAL_STATE);

  const initialGrade = (isEdit ? mode.student.grade : 1) as Grade;
  const initialSection = (
    isEdit ? mode.student.class_section : "junior 1"
  ) as ClassSection;

  const [grade, setGrade] = useState<Grade>(initialGrade);
  const [section, setSection] = useState<ClassSection>(initialSection);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  useEffect(() => {
    if (!isValidGradeClassSection(grade, section)) {
      setSection(grade <= 3 ? "junior 1" : "senior 1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "학생 수정" : "학생 추가"}</DialogTitle>
          <DialogDescription>
            이름·학년·반을 입력하세요. 1~3학년은 junior, 4~6학년은 senior 1만 가능.
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          key={isEdit ? mode.student.id : "create"}
          className="space-y-4"
        >
          {isEdit ? (
            <input type="hidden" name="id" value={mode.student.id} />
          ) : null}
          <Field>
            <FieldLabel htmlFor="name">이름</FieldLabel>
            <Input
              id="name"
              name="name"
              defaultValue={isEdit ? mode.student.name : ""}
              required
              disabled={pending}
              placeholder="예: 홍길동"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="grade">학년</FieldLabel>
              <Select
                name="grade"
                value={String(grade)}
                onValueChange={(v) => setGrade(Number(v) as Grade)}
                disabled={pending}
              >
                <SelectTrigger id="grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {g}학년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="class_section">반</FieldLabel>
              <Select
                name="class_section"
                value={section}
                onValueChange={(v) => setSection(v as ClassSection)}
                disabled={pending}
              >
                <SelectTrigger id="class_section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_SECTIONS.map((s) => {
                    const allowed = isValidGradeClassSection(grade, s.id);
                    return (
                      <SelectItem
                        key={s.id}
                        value={s.id}
                        disabled={!allowed}
                      >
                        {s.id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {state.error ? <FieldError>{state.error}</FieldError> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              취소
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "처리 중…" : isEdit ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
