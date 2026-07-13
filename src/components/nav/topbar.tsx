"use client";

import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";
import { ROLE_LABELS } from "@/lib/nav";
import type { Role } from "@/lib/auth/guards";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function Topbar({
  name,
  role,
  onMenuClick,
}: {
  name: string;
  role: Role;
  onMenuClick: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-5">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Menyuni ochish"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
          {initials(name)}
        </div>
        <div className="hidden text-right text-sm sm:block">
          <div className="font-medium leading-tight text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">{ROLE_LABELS[role]}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ml-1 flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Chiqish</span>
        </button>
      </div>
    </header>
  );
}
