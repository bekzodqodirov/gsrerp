"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/input";
import { addLoadingPlanItem } from "@/lib/actions/loading";
import type { ActionState } from "@/lib/actions/action-state";

type BatchOption = { id: string; label: string; remaining: number; alreadyPlanned: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Qo'shilmoqda..." : "Rejaga qo'shish"}
    </Button>
  );
}

export function PlanForm({ loadingEventId, batches }: { loadingEventId: string; batches: BatchOption[] }) {
  const action = addLoadingPlanItem.bind(null, loadingEventId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
      <Field label="Partiya" error={state.fieldErrors?.intakeBatchId}>
        <Select name="intakeBatchId" required defaultValue="">
          <option value="" disabled>
            — tanlang —
          </option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label} (qolgan: {b.remaining}
              {b.alreadyPlanned > 0 ? `, rejada: ${b.alreadyPlanned}` : ""})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Miqdor" error={state.fieldErrors?.plannedCount}>
        <Input type="number" name="plannedCount" step="1" min="1" required className="w-24" />
      </Field>
      <div className="flex items-end">
        <SubmitButton />
      </div>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>}
    </form>
  );
}
