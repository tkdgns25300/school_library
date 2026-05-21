"use client";

import { DeleteDialog } from "@/components/delete-dialog";

import { removeBook } from "./actions";

type Book = {
  id: string;
  title: string;
};

export function BookDeleteDialog({
  book,
  open,
  onOpenChange,
}: {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!book) return null;
  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="책 삭제"
      description={
        <>
          <strong>
            {book.id} · {book.title}
          </strong>{" "}
          을 삭제하시겠어요? 활성 대여 또는 대여 이력이 있으면 삭제되지
          않습니다.
        </>
      }
      id={book.id}
      action={removeBook}
    />
  );
}
