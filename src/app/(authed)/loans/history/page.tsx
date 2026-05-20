import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { getLoanHistory } from "@/lib/queries/loan-history";

import { HistoryView } from "./history-view";

export default async function LoanHistoryPage() {
  "use cache";
  cacheTag("loans", "students", "books");
  cacheLife("days");

  const history = await getLoanHistory();

  return (
    <>
      <PageHeader title="대여 내역" />
      <main className="flex-1 bg-muted/30 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <HistoryView history={history} />
        </div>
      </main>
    </>
  );
}
