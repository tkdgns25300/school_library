import { unstable_cache } from "next/cache";

import { CLASS_SECTIONS } from "@/constants/class-sections";
import { createServiceClient } from "@/lib/supabase/service";
import type { ClassSection } from "@/types/domain";

export type ClassStats = {
  studentCount: number;
  activeCount: number;
  overdueCount: number;
};

export const getClassStats = unstable_cache(
  async (today: string): Promise<Record<ClassSection, ClassStats>> => {
    const supabase = createServiceClient();
    const [studentsRes, loansRes] = await Promise.all([
      supabase.from("students").select("id, class_section"),
      supabase
        .from("loans")
        .select("student_id, due_date")
        .is("returned_at", null),
    ]);

    const students = studentsRes.data ?? [];
    const loans = loansRes.data ?? [];

    const result = {} as Record<ClassSection, ClassStats>;
    for (const section of CLASS_SECTIONS) {
      const studentIds = new Set(
        students
          .filter((s) => s.class_section === section.id)
          .map((s) => s.id),
      );
      const sectionLoans = loans.filter((l) => studentIds.has(l.student_id));
      result[section.id] = {
        studentCount: studentIds.size,
        activeCount: sectionLoans.length,
        overdueCount: sectionLoans.filter((l) => l.due_date < today).length,
      };
    }
    return result;
  },
  ["class-stats"],
  { tags: ["students", "loans"], revalidate: 1800 },
);
