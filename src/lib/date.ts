export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const MS_PER_DAY = 86_400_000;

/**
 * Whole days that `dueDate` is past `today` (both YYYY-MM-DD).
 * Returns 0 if not overdue yet.
 */
export function overdueDays(dueDate: string, today: string): number {
  if (dueDate >= today) return 0;
  return Math.floor((Date.parse(today) - Date.parse(dueDate)) / MS_PER_DAY);
}
