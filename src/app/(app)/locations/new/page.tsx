"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createLocation } from "@/lib/actions/locations";
import type { ActionState } from "@/lib/actions/action-state";

export default function NewLocationPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createLocation, {});

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi joylashuv qo&apos;shish</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <Field label="Nomi" error={state.fieldErrors?.name}>
              <Input name="name" required placeholder="masalan: Toshkent ombori" />
            </Field>
            <Field label="Turi" error={state.fieldErrors?.type}>
              <Select name="type" required defaultValue="warehouse">
                <option value="warehouse">Ombor</option>
                <option value="border_crossing">Chegara</option>
                <option value="customs">Bojxona</option>
              </Select>
            </Field>
            <Field label="Davlat" error={state.fieldErrors?.country}>
              <Input name="country" required placeholder="masalan: Uzbekistan" />
            </Field>
            {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
