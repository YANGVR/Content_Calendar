"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createContent, type ContentFormState } from "./actions";
import { CONTENT_KIND_LABELS, CONTENT_KINDS, type ContentKind } from "./kinds";

const KIND_ITEMS = CONTENT_KINDS.map((kind) => ({
  value: kind,
  label: CONTENT_KIND_LABELS[kind],
}));

export function ContentForm() {
  const [state, formAction, pending] = useActionState<
    ContentFormState,
    FormData
  >(createContent, {});
  const [kind, setKind] = useState<ContentKind>("drama");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="title">이름</FieldLabel>
          <Input id="title" name="title" maxLength={100} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="kind">종류</FieldLabel>
          <Select
            name="kind"
            items={KIND_ITEMS}
            value={kind}
            onValueChange={(value) => value && setKind(value as ContentKind)}
          >
            <SelectTrigger id="kind" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {kind !== "movie" && (
          <Field>
            <FieldLabel htmlFor="episode_count">회차 수</FieldLabel>
            <Input
              id="episode_count"
              name="episode_count"
              type="number"
              min={1}
              max={2000}
              className="w-32"
              required
            />
            <FieldDescription>1화부터 이 회차까지 기록할 수 있어요.</FieldDescription>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="image">섬네일 이미지</FieldLabel>
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
          />
          <FieldDescription>선택 사항 · JPG, PNG, WEBP, GIF · 5MB 이하</FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" className="self-start" disabled={pending}>
        추가하기
      </Button>
    </form>
  );
}
