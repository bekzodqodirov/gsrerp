"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { updateIntakeBatch, deleteIntakeBatch } from "@/lib/actions/intake";
import type { ActionState } from "@/lib/actions/action-state";

type DefaultValues = {
  productName: string;
  packageCount: string;
  volumeCbm: string;
  totalWeightKg: string;
  lengthM: string;
  widthM: string;
  heightM: string;
  unitGrossWeightKg: string;
  costNotes: string;
  packingType: string;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
    </Button>
  );
}

export function EditBatchForm({ batchId, defaultValues }: { batchId: string; defaultValues: DefaultValues }) {
  const updateWithId = updateIntakeBatch.bind(null, batchId);
  const [state, formAction] = useActionState<ActionState, FormData>(updateWithId, {});

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mahsulot nomi">
            <Input name="productName" defaultValue={defaultValues.productName} placeholder="masalan: o'yinchoq" />
          </Field>
          <Field label="Qadoqlash turi">
            <Select name="packingType" defaultValue={defaultValues.packingType} required>
              <option value="carton">Karton (纸箱)</option>
              <option value="woven_bag">Paket (编织袋)</option>
              <option value="pallet">Pallet (托盘)</option>
              <option value="other">Boshqa</option>
            </Select>
          </Field>
          <Field label="Karobka soni" error={state.fieldErrors?.packageCount}>
            <Input type="number" step="1" name="packageCount" defaultValue={defaultValues.packageCount} required />
          </Field>
          <Field label="Umumiy kub, m³" error={state.fieldErrors?.volumeCbm}>
            <Input type="number" step="0.001" name="volumeCbm" defaultValue={defaultValues.volumeCbm} required />
          </Field>
          <Field label="Umumiy kg" error={state.fieldErrors?.totalWeightKg}>
            <Input type="number" step="0.01" name="totalWeightKg" defaultValue={defaultValues.totalWeightKg} required />
          </Field>
          <Field label="Izoh">
            <Input name="costNotes" defaultValue={defaultValues.costNotes} />
          </Field>
        </div>

        <details className="rounded-md border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            O&apos;lchamlar (ixtiyoriy, faqat yordamchi ma&apos;lumot uchun)
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Uzunlik, m">
              <Input type="number" step="0.001" name="lengthM" defaultValue={defaultValues.lengthM} />
            </Field>
            <Field label="Kenglik, m">
              <Input type="number" step="0.001" name="widthM" defaultValue={defaultValues.widthM} />
            </Field>
            <Field label="Balandlik, m">
              <Input type="number" step="0.001" name="heightM" defaultValue={defaultValues.heightM} />
            </Field>
            <Field label="1 dona, kg">
              <Input type="number" step="0.01" name="unitGrossWeightKg" defaultValue={defaultValues.unitGrossWeightKg} />
            </Field>
          </div>
        </details>

        {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
        <SaveButton />
      </form>

      <DeleteBatchSection batchId={batchId} />
    </div>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="danger"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Haqiqatan ham bu kirim yozuvini butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.")) {
          e.preventDefault();
        }
      }}
    >
      {pending ? "O'chirilmoqda..." : "Partiyani o'chirish"}
    </Button>
  );
}

function DeleteBatchSection({ batchId }: { batchId: string }) {
  const deleteWithId = deleteIntakeBatch.bind(null, batchId);
  const [state, formAction] = useActionState<ActionState, FormData>(deleteWithId, {});

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <h3 className="text-sm font-semibold text-red-800">Xavfli zona</h3>
      <p className="mt-1 text-xs text-red-700">
        Xato kiritilgan kirimni butunlay o&apos;chirish mumkin — lekin faqat hali yuklama qilinmagan bo&apos;lsa.
      </p>
      <form action={formAction} className="mt-3">
        <DeleteSubmitButton />
        {state.error && <p className="mt-2 text-sm font-medium text-red-700">{state.error}</p>}
      </form>
    </div>
  );
}
