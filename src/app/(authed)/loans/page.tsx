import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { todayIso } from "@/lib/date";
import { getLoansForMonitoring } from "@/lib/queries/loans";

import { LoansView } from "./loans-view";

export default async function LoansPage() {
  "use cache";
  cacheTag("loans", "students", "books");
  cacheLife("days");

  const today = todayIso();
  const data = await getLoansForMonitoring(today);

  return (
    <>
      <PageHeader title="대여 현황" />
      <main className="flex-1 bg-muted/30 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <LoansView
            loans={data.loans}
            totalActive={data.totalActive}
            overdueCount={data.overdueCount}
            maxOverdueDays={data.maxOverdueDays}
            dueTodayCount={data.dueTodayCount}
            today={today}
          />
        </div>
      </main>
    </>
  );
}
