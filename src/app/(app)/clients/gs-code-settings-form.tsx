"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { setGsCodeCounter } from "@/lib/actions/gs-code";
import type { ActionState } from "@/lib/actions/action-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Yangilash"}
    </Button>
  );
}

export function GsCodeSettingsForm({ prefix, nextValue }: { prefix: string; nextValue: number }) {
  const [state, formAction] = useActionState<ActionState, FormData>(setGsCodeCounter, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="Prefiks" error={state.fieldErrors?.prefix}>
        <Input name="prefix" defaultValue={prefix} className="w-20" />
      </Field>
      <Field label="Keyingi raqam" error={state.fieldErrors?.nextValue}>
        <Input type="number" step="1" name="nextValue" defaultValue={nextValue} className="w-28" />
      </Field>
      <SubmitButton />
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
