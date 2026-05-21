"use server";

import { updateTag } from "next/cache";
import Papa from "papaparse";

import {
  isValidGradeClassSection,
} from "@/constants/class-sections";
import type { CsvImportResult, CsvImportState } from "@/lib/csv-import";
import { createClient } from "@/lib/supabase/server";
import type { ClassSection, Grade } from "@/types/domain";

const VALID_SECTIONS: ReadonlyArray<ClassSection> = [
  "junior 1",
  "junior 2",
  "senior 1",
];

function isValidSection(value: string): value is ClassSection {
  return (VALID_SECTIONS as ReadonlyArray<string>).includes(value);
}

function isValidGrade(value: number): value is Grade {
  return Number.isInteger(value) && value >= 1 && value <= 6;
}

export type StudentFormState = {
  error?: string;
  ok?: boolean;
};

type ParsedForm =
  | { name: string; grade: Grade; classSection: ClassSection }
  | { error: string };

function readForm(formData: FormData): ParsedForm {
  const name = formData.get("name");
  const gradeRaw = formData.get("grade");
  const classSection = formData.get("class_section");

  if (typeof name !== "string" || name.trim() === "") {
    return { error: "이름을 입력해주세요." };
  }

  const grade = typeof gradeRaw === "string" ? Number.parseInt(gradeRaw, 10) : NaN;
  if (!isValidGrade(grade)) {
    return { error: "학년은 1~6 사이로 선택해주세요." };
  }

  if (typeof classSection !== "string" || !isValidSection(classSection)) {
    return { error: "유효한 반을 선택해주세요." };
  }

  if (!isValidGradeClassSection(grade, classSection)) {
    return {
      error:
        "학년·반 조합이 올바르지 않습니다. 1~3학년은 junior 1/2, 4~6학년은 senior 1.",
    };
  }

  return { name: name.trim(), grade, classSection };
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("students").insert({
    name: parsed.name,
    grade: parsed.grade,
    class_section: parsed.classSection,
  });

  if (error) {
    return { error: "학생 등록에 실패했습니다." };
  }

  updateTag("students");
  return { ok: true };
}

export async function updateStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "학생 ID가 없습니다." };
  }

  const parsed = readForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      name: parsed.name,
      grade: parsed.grade,
      class_section: parsed.classSection,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "학생 수정에 실패했습니다." };
  }

  updateTag("students");
  return { ok: true };
}

export async function removeStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "학생 ID가 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "활성 대여 또는 대여 이력이 있어 삭제할 수 없습니다.",
      };
    }
    return { error: "학생 삭제에 실패했습니다." };
  }

  updateTag("students");
  return { ok: true };
}

type CsvRow = {
  name?: string;
  grade?: string;
  class_section?: string;
};

export async function importStudentsCsv(
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
    const gradeStr = row.grade?.trim() ?? "";
    const classSection = row.class_section?.trim() ?? "";

    if (name === "") {
      results.push({ row: rowNumber, label: "", error: "이름 누락" });
      continue;
    }

    const grade = Number.parseInt(gradeStr, 10);
    if (!isValidGrade(grade)) {
      results.push({ row: rowNumber, label: name, error: "학년이 1~6이 아님" });
      continue;
    }

    if (!isValidSection(classSection)) {
      results.push({ row: rowNumber, label: name, error: "유효하지 않은 반" });
      continue;
    }

    if (!isValidGradeClassSection(grade, classSection)) {
      results.push({
        row: rowNumber,
        label: name,
        error: "학년·반 조합 불일치",
      });
      continue;
    }

    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("name", name)
      .eq("grade", grade)
      .eq("class_section", classSection)
      .maybeSingle();

    if (existing) {
      results.push({ row: rowNumber, label: name, error: "이미 등록된 학생" });
      continue;
    }

    const { error } = await supabase
      .from("students")
      .insert({ name, grade, class_section: classSection });

    if (error) {
      results.push({ row: rowNumber, label: name, error: "DB 오류" });
      continue;
    }

    results.push({ row: rowNumber, label: name });
  }

  updateTag("students");
  const successCount = results.filter((r) => !r.error).length;
  return { results, successCount };
}
