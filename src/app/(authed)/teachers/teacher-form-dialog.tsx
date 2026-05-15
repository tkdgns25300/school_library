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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const FIELD_LABEL_CLASS = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

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
          className="space-y-5"
        >
          {isEdit ? (
            <input type="hidden" name="id" value={mode.teacher.id} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name" className={FIELD_LABEL_CLASS}>
              이름
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={isEdit ? mode.teacher.name : ""}
              required
              disabled={pending}
              placeholder="예: 김지영"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class_section" className={FIELD_LABEL_CLASS}>
              담당 반
            </Label>
            <Select
              name="class_section"
              defaultValue={isEdit ? mode.teacher.class_section : "junior 1"}
              disabled={pending}
            >
              <SelectTrigger id="class_section" className="w-full">
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
          </div>
          {state.error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
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
