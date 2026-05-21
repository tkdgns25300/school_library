"use client";

import { DeleteDialog } from "@/components/delete-dialog";

import { removeTeacher } from "./actions";

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
  if (!teacher) return null;
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="교사 삭제"
      description={
        <>
          <strong>{teacher.name}</strong> 교사를 삭제하시겠어요? 처리한 대여
          이력이 있는 교사는 삭제되지 않습니다.
        </>
      }
      id={teacher.id}
      action={removeTeacher}
    />
  );
}
