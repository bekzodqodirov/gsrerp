import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/guards";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  const photo = await prisma.intakePhoto.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  if (!photo) return new Response("Topilmadi", { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
