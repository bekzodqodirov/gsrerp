import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "./user-form";

export default async function NewUserPage() {
  await requireRole(["admin"]);
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Yangi foydalanuvchi qo&apos;shish</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm locations={locations} />
        </CardContent>
      </Card>
    </div>
  );
}
