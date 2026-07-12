// GS1 SSCC (Serial Shipping Container Code) — the international logistics standard for
// identifying individual shipping units (cartons, pallets). Structure is always 18 digits:
//   [Extension digit: 1] [GS1 Company Prefix: 7-10] [Serial Reference: fills to 16] [Check digit: 1]
// This company doesn't hold a real GS1 membership (paid, via gs1.org), so COMPANY_PREFIX
// below is a clearly-internal placeholder — but the structure and check-digit algorithm
// are the real GS1 standard, so switching to a genuine issued prefix later is a one-line change.
const EXTENSION_DIGIT = "0";
const COMPANY_PREFIX = "9000001"; // placeholder — not a GS1-issued prefix
const SERIAL_DIGITS = 18 - 1 - EXTENSION_DIGIT.length - COMPANY_PREFIX.length; // 9 digits

// GS1 standard check digit: sum digits right-to-left with alternating weights 3,1,3,1...
// then round up to the next multiple of 10 and take the difference.
export function gs1CheckDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = Number(digits[digits.length - 1 - i]);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }
  const check = (10 - (sum % 10)) % 10;
  return String(check);
}

export function generateSscc(serial: number): string {
  const serialRef = String(serial).padStart(SERIAL_DIGITS, "0").slice(-SERIAL_DIGITS);
  const base = EXTENSION_DIGIT + COMPANY_PREFIX + serialRef;
  return base + gs1CheckDigit(base);
}

export function isValidSscc(sscc: string): boolean {
  if (!/^\d{18}$/.test(sscc)) return false;
  return gs1CheckDigit(sscc.slice(0, 17)) === sscc.slice(17);
}

// Groups an 18-digit SSCC for human-readable printing under the barcode/QR, matching
// how GS1 labels conventionally display it: (00) extension+prefix serial check
export function formatSsccDisplay(sscc: string): string {
  if (!/^\d{18}$/.test(sscc)) return sscc;
  return `(00) ${sscc.slice(0, 1)} ${sscc.slice(1, 8)} ${sscc.slice(8, 17)} ${sscc.slice(17)}`;
}

// A scanned QR may contain a full URL (/scan/carton/<sscc>) or just the raw code typed
// manually — pull the actual SSCC out of either form.
export function extractScanCode(rawValue: string): string {
  try {
    const url = new URL(rawValue);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? rawValue;
  } catch {
    return rawValue.trim();
  }
}
