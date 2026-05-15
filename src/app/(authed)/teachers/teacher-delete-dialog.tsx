"use client";

import { useActionState, useEffect } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { removeTeacher, type TeacherFormState } from "./actions";

const INITIAL_STATE: TeacherFormState = {};

type Teacher = {
  id: string;
  name: string;
};

export function TeacherDeleteDialog({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState<
    TeacherFormState,
    FormData
  >(removeTeacher, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  if (!teacher) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>교사 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{teacher.name}</strong> 교사를 삭제하시겠어요? 처리한 대여 이력이
            있는 교사는 삭제되지 않습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={teacher.id} />
          {state.error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              취소
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "삭제 중…" : "삭제"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
