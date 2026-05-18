import { PageHeader } from "@/components/layout/page-header";
import { getLoansForMonitoring } from "@/lib/queries/loans";

import { LoansView } from "./loans-view";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function LoansPage() {
  const data = await getLoansForMonitoring(todayIso());

  return (
    <>
      <PageHeader title="대여 현황" subtitle="빌려간 책 · 연체 한눈에" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <LoansView
            loans={data.loans}
            teachers={data.teachers}
            totalActive={data.totalActive}
            overdueCount={data.overdueCount}
            maxOverdueDays={data.maxOverdueDays}
            dueTodayCount={data.dueTodayCount}
          />
        </div>
      </main>
    </>
  );
}
