import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type Role = "admin" | "warehouse" | "logistics" | "accounting" | "sales";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role as Role)) {
    redirect("/dashboard?denied=1");
  }
  return session;
}
