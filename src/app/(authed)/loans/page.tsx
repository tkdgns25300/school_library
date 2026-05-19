import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { todayIso } from "@/lib/date";
import { getLoansForMonitoring } from "@/lib/queries/loans";

import { LoansView } from "./loans-view";

export default async function LoansPage() {
  "use cache";
  cacheTag("loans", "students", "books", "teachers");
  cacheLife("days");

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
