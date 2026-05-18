import { todayIso } from "@/lib/date";

type ActiveLoanLike = {
  due_date: string;
  student: { grade: number; name: string };
};

// 대여 데스크 — 대여 중 리스트: 연체 먼저 → 학년 ↑ → 이름
export function sortActiveLoansForOperation<T extends ActiveLoanLike>(
  loans: ReadonlyArray<T>,
): T[] {
  const today = todayIso();
  return [...loans].sort((a, b) => {
    const aOverdue = a.due_date < today;
    const bOverdue = b.due_date < today;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (a.student.grade !== b.student.grade) {
      return a.student.grade - b.student.grade;
    }
    return a.student.name.localeCompare(b.student.name, "ko");
  });
}

// 대여 현황(/loans): 연체 먼저 → 학년 ↑ → 반납 예정일 ↑
export function sortLoansForRecall<T extends ActiveLoanLike>(
  loans: ReadonlyArray<T>,
): T[] {
  const today = todayIso();
  return [...loans].sort((a, b) => {
    const aOverdue = a.due_date < today;
    const bOverdue = b.due_date < today;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (a.student.grade !== b.student.grade) {
      return a.student.grade - b.student.grade;
    }
    return a.due_date.localeCompare(b.due_date);
  });
}
