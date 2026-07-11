// Parses the historical warehouse Excel sheets (货号/唛头, 长/宽/高, 件数, 品名, 数量, 包装, 入库日期, 费用明细).
// Column order varies between files, so we detect columns by header keywords instead of fixed positions.

export type ParsedIntakeRow = {
  rowIndex: number;
  clientCode: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  packageCount: number;
  productName?: string;
  unitQty?: number;
  packingType: "carton" | "woven_bag" | "pallet" | "other";
  intakeDate?: string; // ISO yyyy-mm-dd
  costNotes?: string;
  unitGrossWeightKg?: number;
};

type ColumnMap = Partial<{
  code: number;
  length: number;
  width: number;
  height: number;
  packageCount: number;
  unitWeight: number;
  totalWeight: number;
  productName: number;
  qty: number;
  packing: number;
  date: number;
  costNotes: number;
}>;

const HEADER_KEYWORDS: Record<keyof ColumnMap, string[]> = {
  code: ["货号", "唛头"],
  length: ["长"],
  width: ["宽"],
  height: ["高"],
  packageCount: ["件数"],
  unitWeight: ["单件", "单重"],
  totalWeight: ["总重"],
  productName: ["品名"],
  qty: ["数量", "qty"],
  packing: ["包装", "packing"],
  date: ["日期", "date"],
  costNotes: ["费用"],
};

function detectHeaderRow(rows: unknown[][]): { headerRowIndex: number; columns: ColumnMap } {
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r];
    if (!row) continue;
    const columns: ColumnMap = {};
    row.forEach((cell, colIdx) => {
      const text = String(cell ?? "").trim();
      if (!text) return;
      for (const key of Object.keys(HEADER_KEYWORDS) as (keyof ColumnMap)[]) {
        if (columns[key] !== undefined) continue;
        if (HEADER_KEYWORDS[key].some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) {
          columns[key] = colIdx;
        }
      }
    });
    // A real header row should at least identify length/width/height/packageCount
    if (columns.length !== undefined && columns.width !== undefined && columns.packageCount !== undefined) {
      return { headerRowIndex: r, columns };
    }
  }
  return { headerRowIndex: -1, columns: {} };
}

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function toPackingType(value: unknown): ParsedIntakeRow["packingType"] {
  const text = String(value ?? "").trim();
  if (text.includes("纸箱") || text.toLowerCase().includes("carton")) return "carton";
  if (text.includes("编织袋") || text.toLowerCase().includes("bag")) return "woven_bag";
  if (text.includes("托盘") || text.toLowerCase().includes("pallet")) return "pallet";
  return "other";
}

function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const text = String(value).trim();
  // Handles formats like 2026.7.1 or 2026-07-01 or 2026/7/1
  const match = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function parseSheetRows(rows: unknown[][]): { rows: ParsedIntakeRow[]; warning?: string } {
  const { headerRowIndex, columns } = detectHeaderRow(rows);
  if (headerRowIndex === -1) {
    return { rows: [], warning: "Ustunlar (长/宽/高/件数) aniqlanmadi. Fayl formatini tekshiring." };
  }

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

    const rawCode = columns.code !== undefined ? String(row[columns.code] ?? "").trim() : "";
    if (rawCode) lastCode = rawCode;
    if (!lastCode) continue;

    result.push({
      rowIndex: r,
      clientCode: lastCode,
      lengthM: length,
      widthM: width,
      heightM: height,
      packageCount,
      productName: columns.productName !== undefined ? String(row[columns.productName] ?? "").trim() || undefined : undefined,
      unitQty: columns.qty !== undefined ? toNumber(row[columns.qty]) : undefined,
      packingType: toPackingType(columns.packing !== undefined ? row[columns.packing] : undefined),
      intakeDate: columns.date !== undefined ? toIsoDate(row[columns.date]) : undefined,
      costNotes: columns.costNotes !== undefined ? String(row[columns.costNotes] ?? "").trim() || undefined : undefined,
      unitGrossWeightKg: columns.unitWeight !== undefined ? toNumber(row[columns.unitWeight]) : undefined,
    });
  }

  return { rows: result };
}
