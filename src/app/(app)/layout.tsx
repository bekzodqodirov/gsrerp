import { requireSession } from "@/lib/auth/guards";
import { Sidebar } from "@/components/nav/sidebar";
import { Topbar } from "@/components/nav/topbar";
import type { Role } from "@/lib/auth/guards";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const role = session.user.role as Role;

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col">
        <Topbar name={session.user.name ?? session.user.email ?? ""} role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
