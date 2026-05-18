import { unstable_cache } from "next/cache";

import { createServiceClient } from "@/lib/supabase/service";

export type BookWithStatus = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  grade_level: number | null;
  language: string;
  level: string | null;
  cover_image_url: string | null;
  isActive: boolean;
};

export const getBooksWithStatus = unstable_cache(
  async (): Promise<BookWithStatus[]> => {
    const supabase = createServiceClient();
    const [booksRes, loansRes] = await Promise.all([
      supabase
        .from("books")
        .select(
          "id, title, author, publisher, grade_level, language, level, cover_image_url",
        )
        .order("id"),
      supabase.from("loans").select("book_id").is("returned_at", null),
    ]);

    const activeBookIds = new Set(
      (loansRes.data ?? []).map((l) => l.book_id),
    );

    return (booksRes.data ?? []).map((b) => ({
      ...b,
      isActive: activeBookIds.has(b.id),
    }));
  },
  ["books-with-status"],
  { tags: ["books", "loans"], revalidate: 1800 },
);
