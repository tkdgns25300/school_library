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

import { removeStudent, type StudentFormState } from "./actions";

const INITIAL_STATE: StudentFormState = {};

type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

export function StudentDeleteDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState<
    StudentFormState,
    FormData
  >(removeStudent, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  if (!student) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>학생 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>
              {student.grade}학년 {student.class_section} {student.name}
            </strong>{" "}
            학생을 삭제하시겠어요? 활성 대여 또는 대여 이력이 있으면 삭제되지 않습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={student.id} />
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
