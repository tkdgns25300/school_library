"use server";

import { updateTag } from "next/cache";
import Papa from "papaparse";

import { createClient } from "@/lib/supabase/server";
import type { ClassSection } from "@/types/domain";

const VALID_SECTIONS: ReadonlyArray<ClassSection> = [
  "junior 1",
  "junior 2",
  "senior 1",
];

function isValidSection(value: string): value is ClassSection {
  return (VALID_SECTIONS as ReadonlyArray<string>).includes(value);
}

export type TeacherFormState = {
  error?: string;
  ok?: boolean;
};

function readForm(formData: FormData): {
  name: string;
  classSection: string;
} | { error: string } {
  const name = formData.get("name");
  const classSection = formData.get("class_section");

  if (typeof name !== "string" || name.trim() === "") {
    return { error: "이름을 입력해주세요." };
  }
  if (typeof classSection !== "string" || !isValidSection(classSection)) {
    return { error: "유효한 담당 반을 선택해주세요." };
  }
  return { name: name.trim(), classSection };
}

export async function createTeacher(
  _prev: TeacherFormState,
  formData: FormData,
): Promise<TeacherFormState> {
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .insert({ name: parsed.name, class_section: parsed.classSection });

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 같은 이름의 교사가 있습니다." };
    }
    return { error: "교사 등록에 실패했습니다." };
  }

  updateTag("teachers");
  return { ok: true };
}

export async function updateTeacher(
  _prev: TeacherFormState,
  formData: FormData,
): Promise<TeacherFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "교사 ID가 없습니다." };
  }
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .update({
      name: parsed.name,
      class_section: parsed.classSection,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "이미 같은 이름의 교사가 있습니다." };
    }
    return { error: "교사 수정에 실패했습니다." };
  }

  updateTag("teachers");
  return { ok: true };
}

export async function removeTeacher(
  _prev: TeacherFormState,
  formData: FormData,
): Promise<TeacherFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "교사 ID가 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "이 교사가 처리한 대여 이력이 있어 삭제할 수 없습니다." };
    }
    return { error: "교사 삭제에 실패했습니다." };
  }

  updateTag("teachers");
  return { ok: true };
}

export type CsvImportResult = {
  row: number;
  name: string;
  error?: string;
};

export type CsvImportState = {
  error?: string;
  successCount?: number;
  results?: CsvImportResult[];
};

type CsvRow = {
  name?: string;
  class_section?: string;
};

export async function importTeachersCsv(
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
    const name = row.name?.trim() ?? "";
    const classSection = row.class_section?.trim() ?? "";

    if (name === "") {
      results.push({ row: rowNumber, name: "", error: "이름 누락" });
      continue;
    }
    if (!isValidSection(classSection)) {
      results.push({ row: rowNumber, name, error: "유효하지 않은 담당 반" });
      continue;
    }

    const { error } = await supabase
      .from("teachers")
      .insert({ name, class_section: classSection });

    if (error) {
      if (error.code === "23505") {
        results.push({ row: rowNumber, name, error: "이미 존재하는 이름" });
      } else {
        results.push({ row: rowNumber, name, error: "DB 오류" });
      }
      continue;
    }

    results.push({ row: rowNumber, name });
  }

  updateTag("teachers");
  const successCount = results.filter((r) => !r.error).length;
  return { results, successCount };
}
