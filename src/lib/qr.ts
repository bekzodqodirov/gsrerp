import QRCode from "qrcode";
import { headers } from "next/headers";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 260 });
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
