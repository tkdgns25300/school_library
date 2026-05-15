import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";

import { BooksView, type BookWithStatus } from "./books-view";

export default async function BooksPage() {
  const supabase = await createClient();

  const [booksRes, loansRes] = await Promise.all([
    supabase
      .from("books")
      .select(
        "id, title, author, publisher, grade_level, language, level, cover_image_url",
      )
      .order("id"),
    supabase
      .from("loans")
      .select("book_id")
      .is("returned_at", null),
  ]);

  const activeBookIds = new Set(
    (loansRes.data ?? []).map((l) => l.book_id),
  );

  const books: BookWithStatus[] = (booksRes.data ?? []).map((b) => ({
    ...b,
    isActive: activeBookIds.has(b.id),
  }));

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
