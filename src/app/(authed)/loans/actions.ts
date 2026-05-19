"use server";

import { updateTag } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ReturnState = {
  error?: string;
  ok?: boolean;
};

export async function returnLoanById(input: {
  loanId: string;
}): Promise<ReturnState> {
  if (!input.loanId) return { error: "대여 정보가 없습니다." };

  const supabase = await createClient();

  const { data: loan } = await supabase
    .from("loans")
    .select("id")
    .eq("id", input.loanId)
    .is("returned_at", null)
    .maybeSingle();

  if (!loan) return { error: "이미 반납된 대여입니다." };

  const { error } = await supabase
    .from("loans")
    .update({
      returned_at: new Date().toISOString(),
    })
    .eq("id", input.loanId);

  if (error) return { error: "반납 처리에 실패했습니다." };

  updateTag("loans");
  return { ok: true };
}
