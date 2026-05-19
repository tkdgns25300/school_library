"use client";

import type { ActiveLoan, Student, Teacher } from "@/lib/queries/operation";
import type { ClassSection } from "@/types/domain";

import { LanguageColumn } from "./language-column";

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
