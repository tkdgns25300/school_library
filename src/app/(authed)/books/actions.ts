"use server";

import { updateTag } from "next/cache";
import Papa from "papaparse";

import { isValidBookLevel } from "@/constants/levels";
import type { CsvImportResult, CsvImportState } from "@/lib/csv-import";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/types/domain";

const VALID_LANGUAGES: ReadonlyArray<Language> = ["ko", "en"];

function isValidLanguage(value: string): value is Language {
  return (VALID_LANGUAGES as ReadonlyArray<string>).includes(value);
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
      language: Language;
      level: string;
      cover: File | null;
    }
  | { error: string };

function readForm(formData: FormData): ParsedForm {
  const title = formData.get("title");
  const author = formData.get("author");
  const publisher = formData.get("publisher");
  const language = formData.get("language");
  const levelRaw = formData.get("level");
  const cover = formData.get("cover");

  if (typeof title !== "string" || title.trim() === "") {
    return { error: "제목을 입력해주세요." };
  }
  if (typeof language !== "string" || !isValidLanguage(language)) {
    return { error: "언어를 선택해주세요." };
  }

  if (typeof levelRaw !== "string" || levelRaw === "" || !isValidBookLevel(levelRaw)) {
    return { error: "단계/레벨을 1~13 중에서 선택해주세요." };
  }
  const level = levelRaw;

  const coverFile =
    cover instanceof File && cover.size > 0 ? cover : null;

  return {
    title: title.trim(),
    author: typeof author === "string" && author.trim() !== "" ? author.trim() : null,
    publisher:
      typeof publisher === "string" && publisher.trim() !== ""
        ? publisher.trim()
        : null,
    language,
    level,
    cover: coverFile,
  };
}

export async function createBook(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  if (parsed.cover === null) {
    return { error: "표지 이미지를 선택해주세요." };
  }

  const supabase = await createClient();
  const id = await nextBookId(supabase);

  // INSERT 먼저 (cover_image_url=null) — Storage 업로드 실패 시 orphan 방지.
  const { error: insertError } = await supabase.from("books").insert({
    id,
    title: parsed.title,
    author: parsed.author,
    publisher: parsed.publisher,
    language: parsed.language,
    level: parsed.level,
    cover_image_url: null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "이미 같은 ID의 책이 존재합니다. 다시 시도해주세요." };
    }
    return { error: "책 등록에 실패했습니다." };
  }

  // 표지 있으면 Storage 업로드 + UPDATE.
  if (parsed.cover) {
    const coverUrl = await uploadCover(supabase, id, parsed.cover);
    if (coverUrl === null) {
      return {
        error: "책은 등록됐으나 표지 업로드에 실패했습니다. 수정에서 다시 시도해주세요.",
      };
    }
    await supabase
      .from("books")
      .update({ cover_image_url: coverUrl })
      .eq("id", id);
  }

  updateTag("books");
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
      language: parsed.language,
      level: parsed.level,
      ...(coverUrl !== undefined ? { cover_image_url: coverUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "책 수정에 실패했습니다." };
  }

  updateTag("books");
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

  updateTag("books");
  return { ok: true };
}

type CsvRow = {
  title?: string;
  author?: string;
  publisher?: string;
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
      results.push({ row: rowNumber, label: "", error: "제목 누락" });
      continue;
    }
    if (!isValidLanguage(language)) {
      results.push({
        row: rowNumber,
        label: title,
        error: "language는 ko 또는 en",
      });
      continue;
    }

    const levelStr = row.level?.trim() ?? "";
    if (levelStr === "" || !isValidBookLevel(levelStr)) {
      results.push({
        row: rowNumber,
        label: title,
        error: "level은 1~13 (필수)",
      });
      continue;
    }

    const coverUrl = row.cover_image_url?.trim() ?? "";
    if (coverUrl === "") {
      results.push({
        row: rowNumber,
        label: title,
        error: "cover_image_url 누락 (필수)",
      });
      continue;
    }

    const id = await nextBookId(supabase);

    const { error } = await supabase.from("books").insert({
      id,
      title,
      author: row.author?.trim() || null,
      publisher: row.publisher?.trim() || null,
      language,
      level: levelStr,
      cover_image_url: coverUrl,
    });

    if (error) {
      results.push({ row: rowNumber, label: title, error: "DB 오류" });
      continue;
    }

    results.push({ row: rowNumber, label: title });
  }

  updateTag("books");
  const successCount = results.filter((r) => !r.error).length;
  return { results, successCount };
}
