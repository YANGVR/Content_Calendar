"use client";

import { useOptimistic, useTransition } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

import { setVisibility } from "./actions";

export function VisibilitySwitch({ isPublic }: { isPublic: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(isPublic);

  return (
    <Field orientation="horizontal" className="items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="is_public">내 기록 공개</FieldLabel>
        <FieldDescription>
          {optimistic
            ? "친구가 내 시청 기록과 별점·한줄평을 볼 수 있어요."
            : "비공개예요. 친구도 내 기록을 볼 수 없어요."}
        </FieldDescription>
      </div>
      <Switch
        id="is_public"
        checked={optimistic}
        disabled={pending}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            setOptimistic(checked);
            await setVisibility(checked);
          })
        }
      />
    </Field>
  );
}
