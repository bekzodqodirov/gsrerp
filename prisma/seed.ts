import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gsrerp.local" },
    update: {},
    create: {
      email: "admin@gsrerp.local",
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });

  const locations = [
    { name: "Yiwu ombori", type: "warehouse" as const, country: "China" },
    { name: "Guangzhou ombori", type: "warehouse" as const, country: "China" },
    { name: "Qashqar/Ulug'chat chegarasi", type: "border_crossing" as const, country: "China" },
    { name: "Andijon bojxonasi", type: "customs" as const, country: "Uzbekistan" },
    { name: "Toshkent ombori", type: "warehouse" as const, country: "Uzbekistan" },
  ];

  for (const loc of locations) {
    const existing = await prisma.location.findFirst({ where: { name: loc.name } });
    if (!existing) {
      await prisma.location.create({ data: loc });
    }
  }

  console.log("Seed complete. Admin login:", admin.email, "/ password:", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
