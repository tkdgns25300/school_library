import { createServiceClient } from "@/lib/supabase/service";
import type { Language } from "@/types/domain";

export type BookWithStatus = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  language: Language;
  level: string | null;
  cover_image_url: string | null;
  isActive: boolean;
};

export async function getBooksWithStatus(): Promise<BookWithStatus[]> {
  const supabase = createServiceClient();
  const [booksRes, loansRes] = await Promise.all([
    supabase
      .from("books")
      .select(
        "id, title, author, publisher, language, level, cover_image_url",
      )
      .order("id"),
    supabase.from("loans").select("book_id").is("returned_at", null),
  ]);

  const activeBookIds = new Set(
    (loansRes.data ?? []).map((l) => l.book_id),
  );

  // DB stores `language` as text; CHECK constraint + Language enum on writes
  // keep it constrained to "ko" | "en", so the cast is safe at this boundary.
  return (booksRes.data ?? []).map((b) => ({
    ...b,
    language: b.language as Language,
    isActive: activeBookIds.has(b.id),
  }));
}
