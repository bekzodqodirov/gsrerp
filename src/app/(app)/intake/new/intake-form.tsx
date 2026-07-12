"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createIntakeBatchesBulk } from "@/lib/actions/intake";
import type { ActionState } from "@/lib/actions/action-state";

type Option = { id: string; label: string };

type Row = {
  id: string;
  productName: string;
  packageCount: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  unitWeightKg: string;
  volumeCbm: string;
  totalWeightKg: string;
  costNotes: string;
};

// X/Y/Z (sm) + 1 dona kg o'zgarganda hajm/og'irlik avtomatik qayta hisoblanadi.
// O'lchash imkoni bo'lmasa, foydalanuvchi Umumiy kub/kg maydonlariga to'g'ridan-to'g'ri
// yozadi — bu maydonlar faqat X/Y/Z/dona-kg to'liq kiritilganda ustiga yoziladi.
const RECOMPUTE_TRIGGERS: (keyof Row)[] = ["packageCount", "lengthCm", "widthCm", "heightCm", "unitWeightKg"];

function emptyRow(): Row {
  return {
    id: Math.random().toString(36).slice(2),
    productName: "",
    packageCount: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    unitWeightKg: "",
    volumeCbm: "",
    totalWeightKg: "",
    costNotes: "",
  };
}

function recomputeRow(row: Row): Row {
  const count = parseFloat(row.packageCount);
  const l = parseFloat(row.lengthCm);
  const w = parseFloat(row.widthCm);
  const h = parseFloat(row.heightCm);
  const unitKg = parseFloat(row.unitWeightKg);
  const next = { ...row };

  if ([count, l, w, h].every((n) => Number.isFinite(n) && n > 0)) {
    next.volumeCbm = ((l * w * h * count) / 1_000_000).toFixed(3);
  }
  if (Number.isFinite(count) && count > 0 && Number.isFinite(unitKg) && unitKg > 0) {
    next.totalWeightKg = (unitKg * count).toFixed(2);
  }
  return next;
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
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: value };
        return RECOMPUTE_TRIGGERS.includes(field) ? recomputeRow(updated) : updated;
      })
    );
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
      unitGrossWeightKg: r.unitWeightKg || undefined,
      lengthM: r.lengthCm ? String(parseFloat(r.lengthCm) / 100) : undefined,
      widthM: r.widthCm ? String(parseFloat(r.widthCm) / 100) : undefined,
      heightM: r.heightCm ? String(parseFloat(r.heightCm) / 100) : undefined,
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
        X/Y/Z va 1 dona kg kiritilsa, Umumiy kub/kg avtomatik hisoblanadi — o&apos;lchash imkoni bo&apos;lmasa
        Umumiy kub/kg ustunlariga to&apos;g&apos;ridan-to&apos;g&apos;ri yozing.
      </p>

      <Field label="Umumiy qabul rasmi (ixtiyoriy, bir nechta)" error={state.fieldErrors?.receiptPhotos}>
        <input
          type="file"
          name="receiptPhotos"
          accept="image/*"
          multiple
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </Field>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2">Mahsulot</th>
              <th className="px-2 py-2">Karobka</th>
              <th className="px-2 py-2">X (sm)</th>
              <th className="px-2 py-2">Y (sm)</th>
              <th className="px-2 py-2">Z (sm)</th>
              <th className="px-2 py-2">1 dona, kg</th>
              <th className="px-2 py-2">Umumiy kub, m³</th>
              <th className="px-2 py-2">Umumiy kg</th>
              <th className="px-2 py-2">Izoh</th>
              <th className="px-2 py-2">Rasm</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td className="px-1 py-2 w-36">
                  <Input value={row.productName} onChange={(e) => updateRow(i, "productName", e.target.value)} />
                </td>
                <td className="px-1 py-2 w-20">
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
                <td className="px-1 py-2 w-20">
                  <Input
                    type="number"
                    step="0.1"
                    value={row.lengthCm}
                    onChange={(e) => updateRow(i, "lengthCm", e.target.value)}
                  />
                </td>
                <td className="px-1 py-2 w-20">
                  <Input
                    type="number"
                    step="0.1"
                    value={row.widthCm}
                    onChange={(e) => updateRow(i, "widthCm", e.target.value)}
                  />
                </td>
                <td className="px-1 py-2 w-20">
                  <Input
                    type="number"
                    step="0.1"
                    value={row.heightCm}
                    onChange={(e) => updateRow(i, "heightCm", e.target.value)}
                  />
                </td>
                <td className="px-1 py-2 w-24">
                  <Input
                    type="number"
                    step="0.01"
                    value={row.unitWeightKg}
                    onChange={(e) => updateRow(i, "unitWeightKg", e.target.value)}
                  />
                </td>
                <td className="px-1 py-2 w-28">
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
                <td className="px-1 py-2 w-28">
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
                <td className="px-1 py-2 w-32">
                  <Input value={row.costNotes} onChange={(e) => updateRow(i, "costNotes", e.target.value)} />
                </td>
                <td className="px-1 py-2 w-32">
                  <input type="file" name={`rowPhotos_${i}`} accept="image/*" multiple className="w-full text-xs" />
                </td>
                <td className="px-1 py-2 text-right">
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
