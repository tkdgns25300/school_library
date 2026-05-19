"use server";

import { updateTag } from "next/cache";

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

export type ScannedBorrower = {
  name: string;
  grade: number;
};

export type ScanResult = {
  error?: string;
  book?: ScannedBook;
  borrower?: ScannedBorrower;
};

export async function lendBook(input: {
  section: ClassSection;
  language: Language;
  bookId: string;
  studentId: string;
  dueDate: string;
}): Promise<ScanResult> {
  const bookId = input.bookId.trim();
  if (bookId === "") return { error: "바코드를 입력해주세요." };
  if (!input.studentId) return { error: "학생을 먼저 선택해주세요." };

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
    due_date: input.dueDate,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 대여 중인 책입니다.", book };
    }
    return { error: "대여 처리에 실패했습니다." };
  }

  updateTag("loans");
  return { book };
}

export async function returnBook(input: {
  section: ClassSection;
  language: Language;
  bookId: string;
}): Promise<ScanResult> {
  const bookId = input.bookId.trim();
  if (bookId === "") return { error: "바코드를 입력해주세요." };

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
    .select("id, student_id")
    .eq("book_id", book.id)
    .is("returned_at", null)
    .maybeSingle();

  if (!loan) return { error: "현재 대여 중이 아닌 책입니다.", book };

  // 반 가드: 빌린 학생이 이 반 소속인지 확인 — 다른 반에서 처리한 책은 그 반에서 반납.
  const { data: borrower } = await supabase
    .from("students")
    .select("class_section, name, grade")
    .eq("id", loan.student_id)
    .maybeSingle();

  if (borrower && borrower.class_section !== input.section) {
    return {
      error: `이 책은 ${borrower.class_section}의 ${borrower.grade}학년 ${borrower.name}이(가) 대여 중입니다. 해당 반에서 반납해주세요.`,
      book,
    };
  }

  const { error } = await supabase
    .from("loans")
    .update({
      returned_at: new Date().toISOString(),
    })
    .eq("id", loan.id);

  if (error) return { error: "반납 처리에 실패했습니다." };

  updateTag("loans");
  return {
    book,
    borrower: borrower
      ? { name: borrower.name, grade: borrower.grade }
      : undefined,
  };
}
