// Parses warehouse Excel/Sheets exports into intake rows. Two source formats are supported:
//  - "direct": the GS RERP tracking sheet itself (GS Kod / Karobka soni / Kub / Kilo columns) —
//    cube and weight are already aggregated per batch, no per-box dimensions exist.
//  - "dims": historical Chinese supplier sheets (货号/唛头, 长/宽/高, 件数) where cube must be
//    computed from per-box dimensions.

export type ParsedIntakeRow = {
  rowIndex: number;
  clientCode: string;
  packageCount: number;
  volumeCbm: number;
  totalWeightKg?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  productName?: string;
  unitQty?: number;
  packingType: "carton" | "woven_bag" | "pallet" | "other";
  intakeDate?: string; // ISO yyyy-mm-dd
  costNotes?: string;
};

type DirectColumnMap = Partial<{
  code: number;
  packageCount: number;
  volume: number;
  weight: number;
  productName: number;
  date: number;
  notes: number;
}>;

type DimsColumnMap = Partial<{
  code: number;
  length: number;
  width: number;
  height: number;
  packageCount: number;
  unitWeight: number;
  productName: number;
  qty: number;
  packing: number;
  date: number;
  costNotes: number;
}>;

const DIRECT_KEYWORDS: Record<keyof DirectColumnMap, string[]> = {
  code: ["gs kod", "gs kodi"],
  packageCount: ["karobka soni", "karobka"],
  volume: ["kub"],
  weight: ["kilo"],
  productName: ["tovar fayli", "mahsulot"],
  date: ["kelgan sana"],
  notes: ["izoh"],
};

const DIMS_KEYWORDS: Record<keyof DimsColumnMap, string[]> = {
  code: ["货号", "唛头"],
  length: ["长"],
  width: ["宽"],
  height: ["高"],
  packageCount: ["件数"],
  unitWeight: ["单件", "单重"],
  productName: ["品名"],
  qty: ["数量", "qty"],
  packing: ["包装", "packing"],
  date: ["日期", "date"],
  costNotes: ["费用"],
};

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function toText(value: unknown): string {
  return String(value ?? "").trim();
}

function toPackingType(value: unknown): ParsedIntakeRow["packingType"] {
  const text = toText(value);
  if (text.includes("纸箱") || text.toLowerCase().includes("carton")) return "carton";
  if (text.includes("编织袋") || text.toLowerCase().includes("bag")) return "woven_bag";
  if (text.includes("托盘") || text.toLowerCase().includes("pallet")) return "pallet";
  return "other";
}

function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const text = toText(value);
  // Handles formats like 2026.7.1, 2026-07-01, 2026/7/1 or 7/9/2026 (m/d/yyyy)
  const ymd = text.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const mdy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return undefined;
}

function findHeaderRow<K extends string>(
  rows: unknown[][],
  keywords: Record<K, string[]>,
  requiredKeys: K[]
): { headerRowIndex: number; columns: Partial<Record<K, number>> } {
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r];
    if (!row) continue;
    const columns: Partial<Record<K, number>> = {};
    row.forEach((cell, colIdx) => {
      const text = toText(cell).toLowerCase();
      if (!text) return;
      for (const key of Object.keys(keywords) as K[]) {
        if (columns[key] !== undefined) continue;
        if (keywords[key].some((kw) => text.includes(kw.toLowerCase()))) {
          columns[key] = colIdx;
        }
      }
    });
    if (requiredKeys.every((k) => columns[k] !== undefined)) {
      return { headerRowIndex: r, columns };
    }
  }
  return { headerRowIndex: -1, columns: {} };
}

function parseDirectFormat(rows: unknown[][], headerRowIndex: number, columns: DirectColumnMap) {
  const result: ParsedIntakeRow[] = [];
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const packageCount = columns.packageCount !== undefined ? toNumber(row[columns.packageCount]) : undefined;
    const volumeCbm = columns.volume !== undefined ? toNumber(row[columns.volume]) : undefined;
    const clientCode = columns.code !== undefined ? toText(row[columns.code]) : "";

    // Skip separator/total rows that carry no batch identity
    if (!packageCount || !volumeCbm || !clientCode) continue;

    result.push({
      rowIndex: r,
      clientCode,
      packageCount,
      volumeCbm,
      totalWeightKg: columns.weight !== undefined ? toNumber(row[columns.weight]) : undefined,
      productName: columns.productName !== undefined ? toText(row[columns.productName]) || undefined : undefined,
      packingType: "other",
      intakeDate: columns.date !== undefined ? toIsoDate(row[columns.date]) : undefined,
      costNotes: columns.notes !== undefined ? toText(row[columns.notes]) || undefined : undefined,
    });
  }
  return result;
}

function parseDimsFormat(rows: unknown[][], headerRowIndex: number, columns: DimsColumnMap) {
  const result: ParsedIntakeRow[] = [];
  let lastCode = "";

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const length = columns.length !== undefined ? toNumber(row[columns.length]) : undefined;
    const width = columns.width !== undefined ? toNumber(row[columns.width]) : undefined;
    const height = columns.height !== undefined ? toNumber(row[columns.height]) : undefined;
    const packageCount = columns.packageCount !== undefined ? toNumber(row[columns.packageCount]) : undefined;

    // Skip group-header / separator / totals rows that have no usable dimensions
    if (!length || !width || !height || !packageCount) continue;

    const rawCode = columns.code !== undefined ? toText(row[columns.code]) : "";
    if (rawCode) lastCode = rawCode;
    if (!lastCode) continue;

    const unitWeight = columns.unitWeight !== undefined ? toNumber(row[columns.unitWeight]) : undefined;

    result.push({
      rowIndex: r,
      clientCode: lastCode,
      lengthM: length,
      widthM: width,
      heightM: height,
      packageCount,
      volumeCbm: length * width * height * packageCount,
      totalWeightKg: unitWeight ? unitWeight * packageCount : undefined,
      productName: columns.productName !== undefined ? toText(row[columns.productName]) || undefined : undefined,
      unitQty: columns.qty !== undefined ? toNumber(row[columns.qty]) : undefined,
      packingType: toPackingType(columns.packing !== undefined ? row[columns.packing] : undefined),
      intakeDate: columns.date !== undefined ? toIsoDate(row[columns.date]) : undefined,
      costNotes: columns.costNotes !== undefined ? toText(row[columns.costNotes]) || undefined : undefined,
    });
  }
  return result;
}

export function parseSheetRows(rows: unknown[][]): { rows: ParsedIntakeRow[]; warning?: string } {
  const direct = findHeaderRow(rows, DIRECT_KEYWORDS, ["code", "packageCount", "volume"]);
  if (direct.headerRowIndex !== -1) {
    return { rows: parseDirectFormat(rows, direct.headerRowIndex, direct.columns) };
  }

  const dims = findHeaderRow(rows, DIMS_KEYWORDS, ["length", "width", "packageCount"]);
  if (dims.headerRowIndex !== -1) {
    return { rows: parseDimsFormat(rows, dims.headerRowIndex, dims.columns) };
  }

  return {
    rows: [],
    warning:
      "Ustunlar aniqlanmadi. Fayl 'GS Kod/Karobka soni/Kub/Kilo' yoki '货号/长/宽/高/件数' formatida bo'lishi kerak.",
  };
}
