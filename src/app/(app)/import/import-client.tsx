"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { parseSheetRows, type ParsedIntakeRow } from "@/lib/import/excel-mapper";
import { importIntakeBatches } from "@/lib/actions/import";

type Option = { id: string; label: string };

export function ImportClient({ locations }: { locations: Option[] }) {
  const [rows, setRows] = useState<ParsedIntakeRow[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [locationId, setLocationId] = useState("");
  const [result, setResult] = useState<{ imported: number; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "" });

    const parsed = parseSheetRows(grid);
    setRows(parsed.rows);
    setWarning(parsed.warning ?? null);
  }

  function handleImport() {
    if (!locationId || rows.length === 0) return;
    startTransition(async () => {
      const res = await importIntakeBatches(locationId, rows);
      setResult(res);
      if (res.imported > 0) {
        setRows([]);
        setFileName(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Excel fayl (.xlsx)">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
        />
      </Field>

      <Field label="Kirim qilinadigan joylashuv (ombor)">
        <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">— tanlang —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
      </Field>

      {fileName && <p className="text-sm text-slate-500">Fayl: {fileName}</p>}
      {warning && <p className="text-sm text-amber-600">{warning}</p>}
      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
      {result && result.imported > 0 && (
        <p className="text-sm text-green-700">{result.imported} ta qator muvaffaqiyatli import qilindi.</p>
      )}

      {rows.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <p className="px-4 pt-3 text-sm text-slate-600">
              Aniqlangan {rows.length} ta qator (birinchi 20 tasi ko&apos;rsatilmoqda):
            </p>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Mijoz kodi</th>
                  <th className="px-3 py-2">O&apos;lcham (LxWxH)</th>
                  <th className="px-3 py-2">Joylar</th>
                  <th className="px-3 py-2">Mahsulot</th>
                  <th className="px-3 py-2">Qadoq</th>
                  <th className="px-3 py-2">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 20).map((r) => (
                  <tr key={r.rowIndex}>
                    <td className="px-3 py-2 font-medium text-slate-900">{r.clientCode}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {r.lengthM}×{r.widthM}×{r.heightM}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.packageCount}</td>
                    <td className="px-3 py-2 text-slate-600">{r.productName ?? "-"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.packingType}</td>
                    <td className="px-3 py-2 text-slate-600">{r.intakeDate ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleImport} disabled={!locationId || rows.length === 0 || isPending}>
        {isPending ? "Import qilinmoqda..." : `Import qilish (${rows.length} qator)`}
      </Button>
    </div>
  );
}
