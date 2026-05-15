type ActiveLoanLike = {
  due_date: string;
  student: { grade: number; name: string };
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// 운영 화면 — 대여 중 리스트: 연체 먼저 → 학년 ↑ → 이름
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
