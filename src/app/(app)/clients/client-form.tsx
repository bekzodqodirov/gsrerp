"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/action-state";

type Option = { id: string; label: string };

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { code?: string; name?: string; phone?: string; notes?: string; salesManagerId?: string };
  salesManagers: Option[];
  submitLabel: string;
};

export function ClientForm({ action, defaultValues, salesManagers, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Mijoz kodi (masalan GS370)" error={state.fieldErrors?.code}>
        <Input name="code" defaultValue={defaultValues?.code} required />
      </Field>
      <Field label="Mijoz nomi" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={defaultValues?.name} required />
      </Field>
      <Field label="Telefon" error={state.fieldErrors?.phone}>
        <Input name="phone" defaultValue={defaultValues?.phone} />
      </Field>
      <Field label="Biriktirilgan sotuv menejeri" error={state.fieldErrors?.salesManagerId}>
        <Select name="salesManagerId" defaultValue={defaultValues?.salesManagerId ?? ""}>
          <option value="">— tanlanmagan —</option>
          {salesManagers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Izoh" error={state.fieldErrors?.notes}>
        <Textarea name="notes" defaultValue={defaultValues?.notes} rows={3} />
      </Field>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saqlanmoqda..." : submitLabel}
      </Button>
    </form>
  );
}
