"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";
import type { Role } from "@/lib/auth/guards";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3">
      <div className="mb-4 px-2 pt-2">
        <span className="text-lg font-bold tracking-tight text-slate-900">GS RERP</span>
      </div>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
