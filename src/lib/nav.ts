import type { Role } from "@/lib/auth/guards";

export type NavItem = {
  href: string;
  label: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Boshqaruv paneli", roles: ["admin", "warehouse", "logistics", "accounting", "sales"] },
  { href: "/clients", label: "Mijozlar", roles: ["admin", "warehouse", "logistics", "accounting", "sales"] },
  { href: "/intake", label: "Kirim (Ombor)", roles: ["admin", "warehouse"] },
  { href: "/import", label: "Excel import", roles: ["admin", "warehouse"] },
  { href: "/stock", label: "Ombor qoldig'i", roles: ["admin", "warehouse", "logistics", "accounting", "sales"] },
  { href: "/scan", label: "QR skanerlash", roles: ["admin", "warehouse", "logistics"] },
  { href: "/trucks", label: "Mashinalar", roles: ["admin", "logistics"] },
  { href: "/loading", label: "Yuklash", roles: ["admin", "logistics"] },
  { href: "/costs", label: "Xarajatlar", roles: ["admin", "accounting"] },
  { href: "/delivery", label: "Yetkazib berish (Места)", roles: ["admin", "logistics", "accounting"] },
  { href: "/reports", label: "Hisobotlar", roles: ["admin", "accounting"] },
  { href: "/activity", label: "Faoliyat tarixi", roles: ["admin", "warehouse", "logistics", "accounting", "sales"] },
  { href: "/locations", label: "Joylashuvlar", roles: ["admin"] },
  { href: "/users", label: "Foydalanuvchilar", roles: ["admin"] },
];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  warehouse: "Ombor xodimi",
  logistics: "Logistika menejeri",
  accounting: "Buxgalteriya",
  sales: "Sotuv menejeri",
};
