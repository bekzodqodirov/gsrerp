import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/nav";

const TABLE_LABELS: Record<string, string> = {
  clients: "Mijozlar",
  intake_batches: "Kirim",
  loading_events: "Yuklash hodisasi",
  loading_line_items: "Yuklash qatori",
  loading_costs: "Yuklash xarajati",
  transit_checkpoints: "Yo'l bosqichi",
  trucks: "Mashinalar",
  locations: "Joylashuvlar",
  users: "Foydalanuvchilar",
  delivery_reconciliations: "Yetkazib berish",
  gs_code_counter: "GS-kod ketma-ketligi",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Yaratdi",
  create_from_import: "Import orqali yaratdi",
  update: "Tahrirladi",
  activate: "Faollashtirdi",
  deactivate: "Nofaollashtirdi",
  status_change: "Holatni o'zgartirdi",
  confirm: "Tasdiqladi",
};

const ACTION_TONE: Record<string, "amber" | "blue" | "green" | "slate" | "red"> = {
  create: "green",
  create_from_import: "green",
  update: "blue",
  activate: "green",
  deactivate: "red",
  status_change: "amber",
  confirm: "blue",
};

function formatDiff(diff: unknown): string {
  if (!diff || typeof diff !== "object") return "-";
  const entries = Object.entries(diff as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "-";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; tableName?: string; from?: string; to?: string }>;
}) {
  await requireSession();
  const { userId, tableName, from, to } = await searchParams;

  const [logs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        userId: userId || undefined,
        tableName: tableName || undefined,
        createdAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(`${to}T23:59:59.999Z`) : undefined,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: true },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, role: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Faoliyat tarixi</h1>
        <div className="text-sm text-slate-500">Oxirgi {logs.length} ta yozuv</div>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Select name="userId" defaultValue={userId ?? ""} className="w-56">
          <option value="">Barcha foydalanuvchilar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({ROLE_LABELS[u.role]})
            </option>
          ))}
        </Select>
        <Select name="tableName" defaultValue={tableName ?? ""} className="w-56">
          <option value="">Barcha jadvallar</option>
          {Object.entries(TABLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <input
          type="date"
          name="from"
          defaultValue={from ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          Filtrlash
        </button>
      </form>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Vaqt</th>
                <th className="px-4 py-2">Foydalanuvchi</th>
                <th className="px-4 py-2">Amal</th>
                <th className="px-4 py-2">Jadval</th>
                <th className="px-4 py-2">Tafsilot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Yozuvlar yo&apos;q
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                    {log.createdAt.toLocaleString("uz-UZ")}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {log.user?.name ?? "Noma'lum"}
                    {log.user && <span className="ml-1 text-xs font-normal text-slate-400">({ROLE_LABELS[log.user.role]})</span>}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={ACTION_TONE[log.action] ?? "slate"}>{ACTION_LABELS[log.action] ?? log.action}</Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{TABLE_LABELS[log.tableName] ?? log.tableName}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDiff(log.diffJson)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
