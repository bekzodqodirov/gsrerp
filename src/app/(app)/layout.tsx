import { requireSession } from "@/lib/auth/guards";
import { AppShell } from "@/components/nav/app-shell";
import type { Role } from "@/lib/auth/guards";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const role = session.user.role as Role;

  return (
    <AppShell role={role} name={session.user.name ?? session.user.email ?? ""}>
      {children}
    </AppShell>
  );
}
