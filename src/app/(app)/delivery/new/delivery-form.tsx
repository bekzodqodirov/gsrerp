"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/input";
import { createDeliveryReconciliation } from "@/lib/actions/delivery";
import type { ActionState } from "@/lib/actions/action-state";

type Option = { id: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Saqlash"}
    </Button>
  );
}

export function DeliveryForm({ clients }: { clients: Option[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createDeliveryReconciliation, {});
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Mijoz" error={state.fieldErrors?.clientId}>
        <Select name="clientId" required defaultValue="">
          <option value="" disabled>
            — tanlang —
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Sana" error={state.fieldErrors?.reconDate}>
        <Input type="date" name="reconDate" required defaultValue={today} />
      </Field>
      <Field label="Kutilayotgan joy soni" error={state.fieldErrors?.expectedPackageCount}>
        <Input type="number" name="expectedPackageCount" step="1" required />
      </Field>
      <Field label="Izoh" error={state.fieldErrors?.discrepancyNotes}>
        <Input name="discrepancyNotes" />
      </Field>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
