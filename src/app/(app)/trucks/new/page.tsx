import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruckForm } from "./truck-form";

export default async function NewTruckPage() {
  await requireRole(["admin", "logistics"]);
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi mashina qo&apos;shish</CardTitle>
        </CardHeader>
        <CardContent>
          <TruckForm locations={locations} />
        </CardContent>
      </Card>
    </div>
  );
}
