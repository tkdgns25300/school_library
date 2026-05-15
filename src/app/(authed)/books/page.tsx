import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";

import { BooksView } from "./books-view";

export default async function BooksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select(
      "id, title, author, publisher, grade_level, language, level, cover_image_url",
    )
    .order("id");

  return (
    <>
      <PageHeader title="책" subtitle="바코드·라벨·표지" />
      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <BooksView books={data ?? []} />
        </div>
      </main>
    </>
  );
}
