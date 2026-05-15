"use client";

import { useActionState, useEffect } from "react";

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
import { CLASS_SECTIONS } from "@/constants/class-sections";

import {
  createTeacher,
  updateTeacher,
  type TeacherFormState,
} from "./actions";

type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

type Mode = { type: "create" } | { type: "edit"; teacher: Teacher };

const INITIAL_STATE: TeacherFormState = {};

export function TeacherFormDialog({
  mode,
  open,
  onOpenChange,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = mode.type === "edit";
  const action = isEdit ? updateTeacher : createTeacher;
  const [state, formAction, pending] = useActionState<
    TeacherFormState,
    FormData
  >(action, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "교사 수정" : "교사 추가"}</DialogTitle>
          <DialogDescription>
            대여·반납 처리 시 담당자 dropdown에 표시됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          key={isEdit ? mode.teacher.id : "create"}
          className="space-y-4"
        >
          {isEdit ? (
            <input type="hidden" name="id" value={mode.teacher.id} />
          ) : null}
          <Field>
            <FieldLabel htmlFor="name">이름</FieldLabel>
            <Input
              id="name"
              name="name"
              defaultValue={isEdit ? mode.teacher.name : ""}
              required
              disabled={pending}
              placeholder="예: 김지영"
              autoFocus
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="class_section">담당 반</FieldLabel>
            <Select
              name="class_section"
              defaultValue={isEdit ? mode.teacher.class_section : "junior 1"}
              disabled={pending}
            >
              <SelectTrigger id="class_section">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_SECTIONS.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
