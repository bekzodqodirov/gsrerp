"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/nav";
import type { Role } from "@/lib/auth/guards";

export function Topbar({ name, role }: { name: string; role: Role }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <div className="font-medium text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">{ROLE_LABELS[role]}</div>
        </div>
        <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
          Chiqish
        </Button>
      </div>
    </header>
  );
}
