import type { Role } from "@/lib/auth/guards";

export type NavGroup = "asosiy" | "ombor" | "logistika" | "moliya" | "boshqaruv";

export type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  group: NavGroup;
};

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  asosiy: "Asosiy",
  ombor: "Ombor oqimi",
  logistika: "Logistika",
  moliya: "Moliya",
  boshqaruv: "Boshqaruv",
};

// Ordered to mirror the real cargo flow: cargo arrives and is logged (Kirim), sits in
// stock, then moves warehouse-to-warehouse (Jo'natish/Qabul) before logistics plans and
// executes truck loads (Yuklash rejasi -> Yuklash) and final delivery.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Boshqaruv paneli", roles: ["admin", "warehouse", "logistics", "accounting", "sales"], group: "asosiy" },
  { href: "/clients", label: "Mijozlar", roles: ["admin", "warehouse", "logistics", "accounting", "sales"], group: "asosiy" },
  { href: "/stock", label: "Ombor qoldig'i", roles: ["admin", "warehouse", "logistics", "accounting", "sales"], group: "asosiy" },

  { href: "/intake", label: "Kirim (yuk qabul qilish)", roles: ["admin", "warehouse"], group: "ombor" },
  { href: "/import", label: "Excel import", roles: ["admin", "warehouse"], group: "ombor" },
  { href: "/dispatch", label: "Jo'natish (o'z omborimdan)", roles: ["admin", "warehouse", "logistics"], group: "ombor" },
  { href: "/receive", label: "Qabul (o'z omborimga)", roles: ["admin", "warehouse", "logistics"], group: "ombor" },
  { href: "/scan", label: "QR tekshirish", roles: ["admin", "warehouse", "logistics"], group: "ombor" },

  { href: "/trucks", label: "Mashinalar", roles: ["admin", "logistics"], group: "logistika" },
  { href: "/loading/plan", label: "Yuklash rejasi", roles: ["admin", "logistics"], group: "logistika" },
  { href: "/loading", label: "Yuklash", roles: ["admin", "logistics"], group: "logistika" },
  { href: "/delivery", label: "Yetkazib berish (Места)", roles: ["admin", "logistics", "accounting"], group: "logistika" },

  { href: "/costs", label: "Xarajatlar", roles: ["admin", "accounting"], group: "moliya" },
  { href: "/reports", label: "Hisobotlar", roles: ["admin", "accounting"], group: "moliya" },
  { href: "/activity", label: "Faoliyat tarixi", roles: ["admin", "warehouse", "logistics", "accounting", "sales"], group: "moliya" },

  { href: "/locations", label: "Joylashuvlar", roles: ["admin"], group: "boshqaruv" },
  { href: "/users", label: "Foydalanuvchilar", roles: ["admin"], group: "boshqaruv" },
];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  warehouse: "Ombor xodimi",
  logistics: "Logistika menejeri",
  accounting: "Buxgalteriya",
  sales: "Sotuv menejeri",
};
