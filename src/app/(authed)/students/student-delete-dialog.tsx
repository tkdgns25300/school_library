"use client";

import { DeleteDialog } from "@/components/delete-dialog";

import { removeStudent } from "./actions";

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
  if (!student) return null;
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="학생 삭제"
      description={
        <>
          <strong>
            {student.grade}학년 {student.class_section} {student.name}
          </strong>{" "}
          학생을 삭제하시겠어요? 활성 대여 또는 대여 이력이 있으면 삭제되지
          않습니다.
        </>
      }
      id={student.id}
      action={removeStudent}
    />
  );
}
