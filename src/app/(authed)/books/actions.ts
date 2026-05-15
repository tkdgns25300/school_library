"use server";

import { revalidatePath } from "next/cache";
import Papa from "papaparse";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/types/domain";

const VALID_LANGUAGES: ReadonlyArray<Language> = ["ko", "en"];

function isValidLanguage(value: string): value is Language {
  return (VALID_LANGUAGES as ReadonlyArray<string>).includes(value);
}

function isValidGradeLevel(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function nextBookId(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from("books")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  const lastId = data?.[0]?.id;
  const lastNum =
    typeof lastId === "string" && lastId.startsWith("BK")
      ? Number.parseInt(lastId.slice(2), 10)
      : 0;
  return "BK" + String(lastNum + 1).padStart(5, "0");
}

async function uploadCover(
  supabase: SupabaseClient,
  bookId: string,
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${bookId}.${ext}`;

  const { error } = await supabase.storage
    .from("book-covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return null;

  const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
  return data.publicUrl;
}

export type BookFormState = {
  error?: string;
  ok?: boolean;
};

type ParsedForm =
  | {
      title: string;
      author: string | null;
      publisher: string | null;
      gradeLevel: number | null;
      language: Language;
      level: string | null;
      cover: File | null;
    }
  | { error: string };

function readForm(formData: FormData): ParsedForm {
  const title = formData.get("title");
  const author = formData.get("author");
  const publisher = formData.get("publisher");
  const gradeRaw = formData.get("grade_level");
  const language = formData.get("language");
  const level = formData.get("level");
  const cover = formData.get("cover");

  if (typeof title !== "string" || title.trim() === "") {
    return { error: "제목을 입력해주세요." };
  }
  if (typeof language !== "string" || !isValidLanguage(language)) {
    return { error: "언어를 선택해주세요." };
  }

  let gradeLevel: number | null = null;
  if (typeof gradeRaw === "string" && gradeRaw !== "" && gradeRaw !== "none") {
    const parsed = Number.parseInt(gradeRaw, 10);
    if (!isValidGradeLevel(parsed)) {
      return { error: "권장 학년은 1~6 또는 비워두세요." };
    }
    gradeLevel = parsed;
  }

  const coverFile =
    cover instanceof File && cover.size > 0 ? cover : null;

  return {
    title: title.trim(),
    author: typeof author === "string" && author.trim() !== "" ? author.trim() : null,
    publisher:
      typeof publisher === "string" && publisher.trim() !== ""
        ? publisher.trim()
        : null,
    gradeLevel,
    language,
    level:
      typeof level === "string" && level.trim() !== "" ? level.trim() : null,
    cover: coverFile,
  };
}

export async function createBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const id = await nextBookId(supabase);

  let coverUrl: string | null = null;
  if (parsed.cover) {
    coverUrl = await uploadCover(supabase, id, parsed.cover);
    if (coverUrl === null) {
      return { error: "표지 업로드에 실패했습니다." };
    }
  }

  const { error } = await supabase.from("books").insert({
    id,
    title: parsed.title,
    author: parsed.author,
    publisher: parsed.publisher,
    grade_level: parsed.gradeLevel,
    language: parsed.language,
    level: parsed.level,
    cover_image_url: coverUrl,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 같은 ID의 책이 존재합니다. 다시 시도해주세요." };
    }
    return { error: "책 등록에 실패했습니다." };
  }

  revalidatePath("/books");
  return { ok: true };
}

export async function updateBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "책 ID가 없습니다." };
  }

  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();

  let coverUrl: string | null | undefined;
  if (parsed.cover) {
    const url = await uploadCover(supabase, id, parsed.cover);
    if (url === null) return { error: "표지 업로드에 실패했습니다." };
    coverUrl = url;
  }

  const { error } = await supabase
    .from("books")
    .update({
      title: parsed.title,
      author: parsed.author,
      publisher: parsed.publisher,
      grade_level: parsed.gradeLevel,
      language: parsed.language,
      level: parsed.level,
      ...(coverUrl !== undefined ? { cover_image_url: coverUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "책 수정에 실패했습니다." };
  }

  revalidatePath("/books");
  return { ok: true };
}

export async function removeBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "책 ID가 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "활성 대여 또는 대여 이력이 있어 삭제할 수 없습니다." };
    }
    return { error: "책 삭제에 실패했습니다." };
  }

  // Storage 객체 정리 (실패해도 무시 — books row 삭제는 성공)
  await supabase.storage.from("book-covers").remove([
    `${id}.jpg`,
    `${id}.jpeg`,
    `${id}.png`,
    `${id}.webp`,
    `${id}.gif`,
  ]);

  revalidatePath("/books");
  return { ok: true };
}

export type CsvImportResult = {
  row: number;
  title: string;
  error?: string;
};

export type CsvImportState = {
  error?: string;
  successCount?: number;
  results?: CsvImportResult[];
};

type CsvRow = {
  title?: string;
  author?: string;
  publisher?: string;
  grade_level?: string;
  language?: string;
  level?: string;
  cover_image_url?: string;
};

export async function importBooksCsv(
  _prev: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "CSV 파일을 선택해주세요." };
  }

  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return { error: `CSV 파싱 실패: ${parsed.errors[0].message}` };
  }

  const supabase = await createClient();
  const results: CsvImportResult[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNumber = i + 2;
    const title = row.title?.trim() ?? "";
    const language = row.language?.trim() ?? "";

    if (title === "") {
      results.push({ row: rowNumber, title: "", error: "제목 누락" });
      continue;
    }
    if (!isValidLanguage(language)) {
      results.push({ row: rowNumber, title, error: "language는 ko 또는 en" });
      continue;
    }

    let gradeLevel: number | null = null;
    const gradeStr = row.grade_level?.trim() ?? "";
    if (gradeStr !== "") {
      const g = Number.parseInt(gradeStr, 10);
      if (!isValidGradeLevel(g)) {
        results.push({ row: rowNumber, title, error: "grade_level은 1~6" });
        continue;
      }
      gradeLevel = g;
    }

    const id = await nextBookId(supabase);

    const { error } = await supabase.from("books").insert({
      id,
      title,
      author: row.author?.trim() || null,
      publisher: row.publisher?.trim() || null,
      grade_level: gradeLevel,
      language,
      level: row.level?.trim() || null,
      cover_image_url: row.cover_image_url?.trim() || null,
    });

    if (error) {
      results.push({ row: rowNumber, title, error: "DB 오류" });
      continue;
    }

    results.push({ row: rowNumber, title });
  }

  revalidatePath("/books");
  const successCount = results.filter((r) => !r.error).length;
  return { results, successCount };
}
