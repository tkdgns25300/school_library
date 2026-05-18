import { PageHeader } from "@/components/layout/page-header";
import { getBooksWithStatus } from "@/lib/queries/books";

import { BooksView } from "./books-view";

export default async function BooksPage() {
  const books = await getBooksWithStatus();

  return (
    <>
      <PageHeader title="책" subtitle="바코드·라벨·표지" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <BooksView books={books} />
        </div>
      </main>
    </>
  );
}
