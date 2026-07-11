"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createIntakeBatch } from "@/lib/actions/intake";
import type { ActionState } from "@/lib/actions/action-state";

type Option = { id: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Kirimni saqlash"}
    </Button>
  );
}

export function IntakeForm({ clients, locations }: { clients: Option[]; locations: Option[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createIntakeBatch, {});
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mijoz (kod)" error={state.fieldErrors?.clientId}>
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
        <Field label="Joylashuv (ombor)" error={state.fieldErrors?.locationId}>
          <Select name="locationId" required defaultValue="">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Kirim sanasi" error={state.fieldErrors?.intakeDate}>
          <Input type="date" name="intakeDate" required defaultValue={today} />
        </Field>
        <Field label="Qadoqlash turi" error={state.fieldErrors?.packingType}>
          <Select name="packingType" required defaultValue="carton">
            <option value="carton">Karton (纸箱)</option>
            <option value="woven_bag">Paket (编织袋)</option>
            <option value="pallet">Pallet (托盘)</option>
            <option value="other">Boshqa</option>
          </Select>
        </Field>
      </div>

      <Field label="Mahsulot nomi" error={state.fieldErrors?.productName}>
        <Input name="productName" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Uzunlik (m)" error={state.fieldErrors?.lengthM}>
          <Input type="number" step="0.001" name="lengthM" required />
        </Field>
        <Field label="Kenglik (m)" error={state.fieldErrors?.widthM}>
          <Input type="number" step="0.001" name="widthM" required />
        </Field>
        <Field label="Balandlik (m)" error={state.fieldErrors?.heightM}>
          <Input type="number" step="0.001" name="heightM" required />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Joylar soni (件数)" error={state.fieldErrors?.packageCount}>
          <Input type="number" step="1" name="packageCount" required />
        </Field>
        <Field label="Dona miqdori (ixtiyoriy)" error={state.fieldErrors?.unitQty}>
          <Input type="number" step="1" name="unitQty" />
        </Field>
        <Field label="1 joy og'irligi, kg (ixtiyoriy)" error={state.fieldErrors?.unitGrossWeightKg}>
          <Input type="number" step="0.01" name="unitGrossWeightKg" />
        </Field>
      </div>

      <p className="text-xs text-slate-500">
        Hajm (m³) va umumiy og&apos;irlik avtomatik hisoblanadi: uzunlik × kenglik × balandlik × joylar soni.
      </p>

      <Field label="Xarajat/izoh (masalan: avtopogruzchik, soliq qaytarish)" error={state.fieldErrors?.costNotes}>
        <Textarea name="costNotes" rows={2} />
      </Field>

      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
