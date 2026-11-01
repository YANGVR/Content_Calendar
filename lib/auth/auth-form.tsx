"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signIn, signUp, type AuthFormState } from "./actions";

type Mode = "login" | "signup";

const COPY: Record<
  Mode,
  {
    title: string;
    description: string;
    submit: string;
    switchText: string;
    switchLink: string;
    switchHref: string;
  }
> = {
  login: {
    title: "로그인",
    description: "아이디와 비밀번호로 로그인하세요.",
    submit: "로그인",
    switchText: "계정이 없나요?",
    switchLink: "가입하기",
    switchHref: "/signup",
  },
  signup: {
    title: "가입하기",
    description: "아이디, 비밀번호, 닉네임을 정하세요.",
    submit: "가입하기",
    switchText: "이미 계정이 있나요?",
    switchLink: "로그인",
    switchHref: "/login",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    mode === "login" ? signIn : signUp,
    {},
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1>{copy.title}</h1>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <FieldGroup>
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="username">아이디</FieldLabel>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                required
              />
              {mode === "signup" && (
                <FieldDescription>
                  영문 소문자, 숫자, 밑줄(_)로 3–20자
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">비밀번호</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
              />
            </Field>
            {mode === "signup" && (
              <Field>
                <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
                <Input id="nickname" name="nickname" maxLength={20} required />
              </Field>
            )}
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {copy.submit}
          </Button>
          <p className="text-sm text-muted-foreground">
            {copy.switchText}{" "}
            <Link
              href={copy.switchHref}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {copy.switchLink}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
