"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ClassSection, Language } from "@/types/domain";

export type ScannedBook = {
  id: string;
  title: string;
  author: string | null;
  language: string;
  level: string | null;
  cover_image_url: string | null;
};

export type ScanResult = {
  error?: string;
  book?: ScannedBook;
};

function revalidate(section: ClassSection): void {
  revalidatePath(`/operation/${encodeURIComponent(section)}`);
  revalidatePath("/");
}

export async function lendBook(input: {
  section: ClassSection;
  language: Language;
  bookId: string;
  studentId: string;
  teacherId: string;
  dueDate: string;
}): Promise<ScanResult> {
  const bookId = input.bookId.trim();
  if (bookId === "") return { error: "바코드를 입력해주세요." };
  if (!input.studentId) return { error: "학생을 먼저 선택해주세요." };
  if (!input.teacherId) return { error: "담당 교사를 먼저 선택해주세요." };

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, language, level, cover_image_url")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) return { error: `${bookId} 책을 찾을 수 없습니다.` };

  if (book.language !== input.language) {
    return {
      error: `이 책은 ${book.language === "ko" ? "한국어" : "English"} 칸에서 처리해주세요.`,
      book,
    };
  }

  const { data: student } = await supabase
    .from("students")
    .select("class_section")
    .eq("id", input.studentId)
    .maybeSingle();

  if (!student || student.class_section !== input.section) {
    return { error: "학생 정보가 올바르지 않습니다." };
  }

  const { error } = await supabase.from("loans").insert({
    book_id: book.id,
    student_id: input.studentId,
    handled_by_teacher_id: input.teacherId,
    due_date: input.dueDate,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 대여 중인 책입니다.", book };
    }
    return { error: "대여 처리에 실패했습니다." };
  }

  revalidate(input.section);
  return { book };
}

export async function returnBook(input: {
  section: ClassSection;
  language: Language;
  bookId: string;
  teacherId: string;
}): Promise<ScanResult> {
  const bookId = input.bookId.trim();
  if (bookId === "") return { error: "바코드를 입력해주세요." };
  if (!input.teacherId) return { error: "담당 교사를 먼저 선택해주세요." };

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, language, level, cover_image_url")
    .eq("id", bookId)
    .maybeSingle();

  if (!book) return { error: `${bookId} 책을 찾을 수 없습니다.` };

  if (book.language !== input.language) {
    return {
      error: `이 책은 ${book.language === "ko" ? "한국어" : "English"} 칸에서 처리해주세요.`,
      book,
    };
  }

  const { data: loan } = await supabase
    .from("loans")
    .select("id")
    .eq("book_id", book.id)
    .is("returned_at", null)
    .maybeSingle();

  if (!loan) return { error: "현재 대여 중이 아닌 책입니다.", book };

  const { error } = await supabase
    .from("loans")
    .update({
      returned_at: new Date().toISOString(),
      returned_by_teacher_id: input.teacherId,
    })
    .eq("id", loan.id);

  if (error) return { error: "반납 처리에 실패했습니다." };

  revalidate(input.section);
  return { book };
}
