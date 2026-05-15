"use client";

import { LanguageColumn } from "./language-column";

type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

export function OperationView({
  students,
  teachers,
}: {
  students: Student[];
  teachers: Teacher[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <LanguageColumn
        language="ko"
        students={students}
        teachers={teachers}
      />
      <LanguageColumn
        language="en"
        students={students}
        teachers={teachers}
      />
    </div>
  );
}
