"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createUser } from "@/lib/actions/users";
import type { ActionState } from "@/lib/actions/action-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Saqlash"}
    </Button>
  );
}

export function UserForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createUser, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Ism" error={state.fieldErrors?.name}>
        <Input name="name" required />
      </Field>
      <Field label="Email" error={state.fieldErrors?.email}>
        <Input type="email" name="email" required />
      </Field>
      <Field label="Rol" error={state.fieldErrors?.role}>
        <Select name="role" required defaultValue="warehouse">
          <option value="admin">Admin</option>
          <option value="warehouse">Ombor xodimi</option>
          <option value="logistics">Logistika menejeri</option>
          <option value="accounting">Buxgalteriya</option>
        </Select>
      </Field>
      <Field label="Vaqtinchalik parol" error={state.fieldErrors?.password}>
        <Input type="text" name="password" required minLength={6} />
      </Field>
      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
