"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { updateNickname, type NicknameFormState } from "./actions";

export function NicknameForm({ nickname }: { nickname: string }) {
  const [state, formAction, pending] = useActionState<
    NicknameFormState,
    FormData
  >(updateNickname, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.saved && (
        <Alert>
          <AlertDescription>닉네임을 저장했습니다.</AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
        <Input
          id="nickname"
          name="nickname"
          defaultValue={nickname}
          maxLength={20}
          required
        />
      </Field>
      <Button type="submit" className="self-start" disabled={pending}>
        저장
      </Button>
    </form>
  );
}
