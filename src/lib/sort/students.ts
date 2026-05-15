import { CLASS_SECTION_ORDER } from "@/constants/class-sections";
import type { ClassSection } from "@/types/domain";
import type { Database } from "@/types/database";

type Student = Database["public"]["Tables"]["students"]["Row"];

export function sortStudentsForRoster<T extends Pick<Student, "grade" | "class_section" | "name">>(
  students: ReadonlyArray<T>,
): T[] {
  return [...students].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    const orderA = CLASS_SECTION_ORDER[a.class_section as ClassSection] ?? Number.MAX_SAFE_INTEGER;
    const orderB = CLASS_SECTION_ORDER[b.class_section as ClassSection] ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, "ko");
  });
}
