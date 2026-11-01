"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { isValidUsername, normalizeUsername, toAuthEmail } from "./username";

export type AuthFormState = { error?: string };

const MIN_PASSWORD_LENGTH = 6;

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (!isValidUsername(username)) {
    return { error: "아이디는 영문 소문자, 숫자, 밑줄(_)로 3–20자여야 합니다." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` };
  }
  if (nickname.length < 1 || nickname.length > 20) {
    return { error: "닉네임은 1–20자여야 합니다." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: toAuthEmail(username),
    password,
    options: { data: { nickname } },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "이미 사용 중인 아이디입니다." };
    }
    return { error: `가입하지 못했습니다. (${error.message})` };
  }
  // With email confirmation enabled, sign-up returns no session.
  if (!data.session) {
    return { error: "가입은 됐지만 로그인되지 않았습니다. 이메일 확인 설정을 꺼 주세요." };
  }

  redirect("/");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!isValidUsername(username) || !password) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(username),
    password,
  });

  if (error) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
