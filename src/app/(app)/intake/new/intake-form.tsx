"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createIntakeBatchesBulk } from "@/lib/actions/intake";
import type { ActionState } from "@/lib/actions/action-state";

type Option = { id: string; label: string };

type Row = {
  productName: string;
  packageCount: string;
  volumeCbm: string;
  totalWeightKg: string;
  costNotes: string;
};

function emptyRow(): Row {
  return { productName: "", packageCount: "", volumeCbm: "", totalWeightKg: "", costNotes: "" };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Kirimni saqlash"}
    </Button>
  );
}

export function IntakeForm({ clients, locations }: { clients: Option[]; locations: Option[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createIntakeBatchesBulk, {});
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const linesJson = JSON.stringify(
    rows.map((r) => ({
      productName: r.productName || undefined,
      packageCount: r.packageCount,
      volumeCbm: r.volumeCbm,
      totalWeightKg: r.totalWeightKg,
      costNotes: r.costNotes || undefined,
    }))
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="linesJson" value={linesJson} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Mijoz (GS-kod)" error={state.fieldErrors?.clientId}>
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

      <p className="text-xs text-slate-500">
        Shu GS-kod va sanada kelgan har xil turdagi karobka/tovarni alohida qator sifatida qo&apos;shing.
      </p>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Mahsulot nomi</th>
              <th className="px-3 py-2">Karobka soni</th>
              <th className="px-3 py-2">Kub, m³</th>
              <th className="px-3 py-2">Kilo, kg</th>
              <th className="px-3 py-2">Izoh</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-2 py-2">
                  <Input
                    value={row.productName}
                    onChange={(e) => updateRow(i, "productName", e.target.value)}
                  />
                </td>
                <td className="px-2 py-2 w-32">
                  <Input
                    type="number"
                    step="1"
                    value={row.packageCount}
                    onChange={(e) => updateRow(i, "packageCount", e.target.value)}
                  />
                  {state.fieldErrors?.[`lines.${i}.packageCount`] && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors[`lines.${i}.packageCount`]}</p>
                  )}
                </td>
                <td className="px-2 py-2 w-28">
                  <Input
                    type="number"
                    step="0.001"
                    value={row.volumeCbm}
                    onChange={(e) => updateRow(i, "volumeCbm", e.target.value)}
                  />
                  {state.fieldErrors?.[`lines.${i}.volumeCbm`] && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors[`lines.${i}.volumeCbm`]}</p>
                  )}
                </td>
                <td className="px-2 py-2 w-28">
                  <Input
                    type="number"
                    step="0.01"
                    value={row.totalWeightKg}
                    onChange={(e) => updateRow(i, "totalWeightKg", e.target.value)}
                  />
                  {state.fieldErrors?.[`lines.${i}.totalWeightKg`] && (
                    <p className="mt-1 text-xs text-red-600">{state.fieldErrors[`lines.${i}.totalWeightKg`]}</p>
                  )}
                </td>
                <td className="px-2 py-2">
                  <Input value={row.costNotes} onChange={(e) => updateRow(i, "costNotes", e.target.value)} />
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="text-xs text-red-600 hover:underline disabled:text-slate-300"
                  >
                    O&apos;chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        + Qator qo&apos;shish
      </button>

      {state.fieldErrors?.lines && <p className="text-sm text-red-600">{state.fieldErrors.lines}</p>}
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
