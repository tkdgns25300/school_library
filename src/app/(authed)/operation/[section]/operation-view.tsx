"use client";

import type { ClassSection } from "@/types/domain";

import { LanguageColumn } from "./language-column";

export type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

export type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

export type ActiveLoan = {
  id: string;
  due_date: string;
  student: { id: string; name: string; grade: number; class_section: string };
  book: { id: string; title: string; author: string | null; language: string };
};

export function OperationView({
  section,
  students,
  teachers,
  koLoans,
  enLoans,
}: {
  section: ClassSection;
  students: Student[];
  teachers: Teacher[];
  koLoans: ActiveLoan[];
  enLoans: ActiveLoan[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <LanguageColumn
        language="ko"
        section={section}
        students={students}
        teachers={teachers}
        loans={koLoans}
      />
      <LanguageColumn
        language="en"
        section={section}
        students={students}
        teachers={teachers}
        loans={enLoans}
      />
    </div>
  );
}
