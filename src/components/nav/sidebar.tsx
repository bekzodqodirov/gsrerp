"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  PackagePlus,
  FileSpreadsheet,
  Warehouse,
  Truck,
  PackageCheck,
  Wallet,
  ClipboardCheck,
  BarChart3,
  History,
  MapPin,
  UserCog,
  X,
  Container,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import type { Role } from "@/lib/auth/guards";

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/clients": Users,
  "/intake": PackagePlus,
  "/import": FileSpreadsheet,
  "/stock": Warehouse,
  "/trucks": Truck,
  "/loading": PackageCheck,
  "/costs": Wallet,
  "/delivery": ClipboardCheck,
  "/reports": BarChart3,
  "/activity": History,
  "/locations": MapPin,
  "/users": UserCog,
};

export function Sidebar({
  role,
  mobileOpen,
  onClose,
}: {
  role: Role;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto bg-slate-900 p-3 transition-transform duration-200 ease-out",
          "md:static md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between px-2 pt-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/40">
              <Container className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              GS <span className="text-indigo-300">RERP</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Menyuni yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = ICONS[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-white shadow-md shadow-accent/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {Icon && <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={2} />}
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto px-3 pb-2 pt-6 text-[11px] text-slate-500">
          GSR Logistics · Yiwu → Toshkent
        </div>
      </nav>
    </>
  );
}
