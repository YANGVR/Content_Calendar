"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type DateMode = "day" | "year" | "none";

const MODES: { value: DateMode; label: string }[] = [
  { value: "day", label: "날짜" },
  { value: "year", label: "연도만" },
  { value: "none", label: "기타" },
];

// Viewing date input: a full date, just a year, or none ("기타"). Shared by
// the add and edit forms.
export function DateField({
  defaultMode = "day",
  defaultDate,
  defaultYear,
}: {
  defaultMode?: DateMode;
  defaultDate: string;
  defaultYear?: string;
}) {
  const [mode, setMode] = useState<DateMode>(defaultMode);
  const thisYear = defaultDate.slice(0, 4);

  return (
    <Field>
      <FieldLabel>시청일</FieldLabel>
      <RadioGroup
        name="date_mode"
        value={mode}
        onValueChange={(value) => setMode(value as DateMode)}
        className="flex flex-wrap gap-4"
        aria-label="시청일 형식"
      >
        {MODES.map((option) => (
          <Field key={option.value} orientation="horizontal" className="w-auto">
            <RadioGroupItem value={option.value} id={`date-mode-${option.value}`} />
            <FieldLabel htmlFor={`date-mode-${option.value}`} className="font-normal">
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      {mode === "day" && (
        <Input
          id="watched_on"
          name="watched_on"
          type="date"
          defaultValue={defaultDate}
          aria-label="시청일"
          required
          className="w-44"
        />
      )}
      {mode === "year" && (
        <div className="flex items-center gap-2">
          <Input
            id="watched_year"
            name="watched_year"
            type="number"
            min={1900}
            max={thisYear}
            defaultValue={defaultYear ?? thisYear}
            aria-label="시청 연도"
            required
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">년</span>
        </div>
      )}
    </Field>
  );
}
