import QRCode from "qrcode";
import { headers } from "next/headers";

export async function generateQrDataUrl(text: string, width = 260): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width });
}

// Har bir jismoniy karobka o'zining harfiga ega bo'lishi kerak: 0->A, 1->B, ..., 25->Z,
// 26->AA... — Excel ustun nomlash tartibi bilan bir xil, shuning uchun karobka soni
// 26 dan oshsa ham (masalan 40 dona) hech qanday cheklovsiz ishlaydi.
export function boxLetter(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

// Builds an absolute URL to this app regardless of where it's deployed, so a QR
// code printed today keeps working after a domain change (Vercel preview, custom
// domain, etc.) — it's derived from the incoming request, not hardcoded.
export async function getAppOrigin(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = hdrs.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
