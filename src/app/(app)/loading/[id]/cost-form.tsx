"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/input";
import { addLoadingCost } from "@/lib/actions/loading";
import type { ActionState } from "@/lib/actions/action-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? "Saqlanmoqda..." : "Xarajat qo'shish"}
    </Button>
  );
}

export function CostForm({ loadingEventId }: { loadingEventId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(addLoadingCost, {});

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="loadingEventId" value={loadingEventId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Xarajat turi" error={state.fieldErrors?.costType}>
          <Select name="costType" required defaultValue="forklift">
            <option value="forklift">Avtopogruzchik (叉车)</option>
            <option value="customs">Bojxona</option>
            <option value="tax_refund">Soliq qaytarish (退税)</option>
            <option value="other">Boshqa</option>
          </Select>
        </Field>
        <Field label="Summa (CNY)" error={state.fieldErrors?.amountCny}>
          <Input type="number" name="amountCny" step="0.01" required />
        </Field>
      </div>
      <Field label="Izoh" error={state.fieldErrors?.notes}>
        <Input name="notes" />
      </Field>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
