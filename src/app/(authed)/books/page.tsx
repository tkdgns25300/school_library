import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { getBooksWithStatus } from "@/lib/queries/books";

import { BooksView } from "./books-view";

export default async function BooksPage() {
  "use cache";
  cacheTag("books", "loans");
  cacheLife("days");

  const books = await getBooksWithStatus();

  return (
    <>
      <PageHeader title="책" />
      <main className="flex-1 bg-muted/30 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <BooksView books={books} />
        </div>
      </main>
    </>
  );
}
