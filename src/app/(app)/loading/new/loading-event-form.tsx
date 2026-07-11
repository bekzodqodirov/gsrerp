"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/input";
import { createLoadingEvent } from "@/lib/actions/loading";
import type { ActionState } from "@/lib/actions/action-state";

type Option = { id: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Yaratilmoqda..." : "Yuklashni boshlash"}
    </Button>
  );
}

export function LoadingEventForm({
  trucks,
  locations,
  defaultTruckId,
}: {
  trucks: Option[];
  locations: Option[];
  defaultTruckId?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createLoadingEvent, {});
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Mashina" error={state.fieldErrors?.truckId}>
        <Select name="truckId" required defaultValue={defaultTruckId ?? ""}>
          <option value="" disabled>
            — tanlang —
          </option>
          {trucks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Yuklash sanasi" error={state.fieldErrors?.loadedDate}>
        <Input type="date" name="loadedDate" required defaultValue={today} />
      </Field>
      <Field label="Qayerdan" error={state.fieldErrors?.fromLocationId}>
        <Select name="fromLocationId" required defaultValue="">
          <option value="" disabled>
            — tanlang —
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Qayerga (ixtiyoriy)" error={state.fieldErrors?.toLocationId}>
        <Select name="toLocationId" defaultValue="">
          <option value="">— tanlanmagan —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
      </Field>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
