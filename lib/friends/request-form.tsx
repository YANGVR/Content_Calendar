"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { sendFriendRequest, type FriendRequestState } from "./actions";

export function FriendRequestForm() {
  const [state, formAction, pending] = useActionState<FriendRequestState, FormData>(
    sendFriendRequest,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          name="username"
          placeholder="친구의 아이디"
          aria-label="친구의 아이디"
          autoCapitalize="none"
          key={state.sentTo ?? "form"}
          required
        />
        <Button type="submit" disabled={pending}>
          친구 요청
        </Button>
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.sentTo && (
        <p className="text-sm text-muted-foreground">
          {state.sentTo}님에게 친구 요청을 보냈어요.
        </p>
      )}
    </form>
  );
}
