"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type NicknameFormState = { error?: string; saved?: boolean };

export async function updateNickname(
  _prev: NicknameFormState,
  formData: FormData,
): Promise<NicknameFormState> {
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname.length < 1 || nickname.length > 20) {
    return { error: "닉네임은 1–20자여야 합니다." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", userId);
  if (error) {
    return { error: `닉네임을 저장하지 못했습니다. (${error.message})` };
  }

  revalidatePath("/settings");
  return { saved: true };
}

// Public: accepted friends can see your records. Private: nobody can.
export async function setVisibility(isPublic: boolean) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return;
  await supabase.from("profiles").update({ is_public: isPublic }).eq("id", userId);
  revalidatePath("/settings");
}
