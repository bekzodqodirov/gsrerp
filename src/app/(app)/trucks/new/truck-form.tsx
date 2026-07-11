"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createTruck } from "@/lib/actions/trucks";
import type { ActionState } from "@/lib/actions/action-state";

type Location = { id: string; name: string };

export function TruckForm({ locations }: { locations: Location[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createTruck, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Kod (masalan KA14, YW-009)" error={state.fieldErrors?.code}>
        <Input name="code" required />
      </Field>
      <Field label="Davlat raqami" error={state.fieldErrors?.plateNumber}>
        <Input name="plateNumber" />
      </Field>
      <Field label="Joriy joylashuv" error={state.fieldErrors?.currentLocationId}>
        <Select name="currentLocationId" defaultValue="">
          <option value="">— tanlanmagan —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </form>
  );
}
