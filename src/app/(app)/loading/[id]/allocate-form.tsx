"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Select, Input, Textarea } from "@/components/ui/input";
import { addLoadingLineItem } from "@/lib/actions/loading";
import type { ActionState } from "@/lib/actions/action-state";

type BatchOption = { id: string; label: string; remaining: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Qo'shish"}
    </Button>
  );
}

export function AllocateForm({ loadingEventId, batches }: { loadingEventId: string; batches: BatchOption[] }) {
  const action = addLoadingLineItem.bind(null, loadingEventId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Partiya (qolgan joy)" error={state.fieldErrors?.intakeBatchId}>
        <Select name="intakeBatchId" required defaultValue="">
          <option value="" disabled>
            — tanlang —
          </option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label} (qolgan: {b.remaining})
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Yuklanadigan joy soni" error={state.fieldErrors?.packageCountLoaded}>
          <Input type="number" name="packageCountLoaded" step="1" required />
        </Field>
        <Field label="Izoh (tuzatish sababi va h.k.)" error={state.fieldErrors?.note}>
          <Textarea name="note" rows={1} />
        </Field>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
      <p className="text-xs text-slate-500">
        Manfiy son kiritish orqali oldingi yozuvni tuzatishingiz mumkin (masalan noto&apos;g&apos;ri kiritilgan bo&apos;lsa)
        — bu avtomatik audit tarixini saqlaydi.
      </p>
    </form>
  );
}
