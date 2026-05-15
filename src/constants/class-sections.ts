import type { ClassSection, Grade } from "@/types/domain";

export const CLASS_SECTIONS = [
  { id: "junior 1", label: "Junior 1", description: "1~3학년 일부", grades: [1, 2, 3] },
  { id: "junior 2", label: "Junior 2", description: "1~3학년 일부", grades: [1, 2, 3] },
  { id: "senior 1", label: "Senior 1", description: "4~6학년 전부", grades: [4, 5, 6] },
] as const satisfies ReadonlyArray<{
  id: ClassSection;
  label: string;
  description: string;
  grades: ReadonlyArray<Grade>;
}>;

export const CLASS_SECTION_ORDER: Record<ClassSection, number> = {
  "junior 1": 1,
  "junior 2": 2,
  "senior 1": 3,
};

export function isValidGradeClassSection(
  grade: Grade,
  classSection: ClassSection,
): boolean {
  if (grade >= 1 && grade <= 3) {
    return classSection === "junior 1" || classSection === "junior 2";
  }
  if (grade >= 4 && grade <= 6) {
    return classSection === "senior 1";
  }
  return false;
}
