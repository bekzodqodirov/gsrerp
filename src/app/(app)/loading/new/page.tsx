import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingEventForm } from "./loading-event-form";

export default async function NewLoadingEventPage({
  searchParams,
}: {
  searchParams: Promise<{ truckId?: string }>;
}) {
  await requireRole(["admin", "logistics"]);
  const { truckId } = await searchParams;

  const [trucks, locations] = await Promise.all([
    prisma.truck.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, plateNumber: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi yuklash hodisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingEventForm
            trucks={trucks.map((t) => ({ id: t.id, label: t.plateNumber ? `${t.code} (${t.plateNumber})` : t.code }))}
            locations={locations.map((l) => ({ id: l.id, label: l.name }))}
            defaultTruckId={truckId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
