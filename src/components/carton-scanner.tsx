"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractScanCode } from "@/lib/sscc";

type ScanResult = { ok: boolean; message: string };
type LogEntry = ScanResult & { id: number };

const RESCAN_COOLDOWN_MS = 2500;

// Embedded, continuous bulk scanner — used wherever staff need to confirm many physical
// cartons in a row (loading a truck, receiving a delivery) without navigating away after
// each one. Decodes QR frames with jsQR (pure JS, works in any browser with a camera) —
// the native BarcodeDetector API this used to rely on isn't available in most desktop
// browsers (Windows Chrome/Edge/Firefox), which meant the camera never even opened there.
export function CartonScanner({ onScan }: { onScan: (code: string) => Promise<ScanResult> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  function pushLog(result: ScanResult) {
    logIdRef.current += 1;
    setLog((prev) => [{ ...result, id: logIdRef.current }, ...prev].slice(0, 20));
  }

  useEffect(() => {
    let stream: MediaStream | undefined;
    let stopped = false;
    let rafId = 0;
    let lastCode = "";
    let lastAt = 0;

    async function handleDetected(rawValue: string) {
      const code = extractScanCode(rawValue);
      const now = Date.now();
      if (code === lastCode && now - lastAt < RESCAN_COOLDOWN_MS) return;
      lastCode = code;
      lastAt = now;
      const result = await onScanRef.current(code);
      pushLog(result);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const canvas = canvasRef.current ?? document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const tick = () => {
          if (stopped || !videoRef.current || !ctx) return;
          const video = videoRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
            if (result?.data) {
              handleDetected(result.data);
            }
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      } catch {
        setCameraError("Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering yoki quyida kodni qo'lda kiriting.");
      }
    }
    start();

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code || busy) return;
    setBusy(true);
    const result = await onScan(code);
    pushLog(result);
    setManualCode("");
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      {!cameraError && (
        <>
          <div className="overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="w-full" muted playsInline />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-center text-xs text-slate-500">
            Karobkalarni birin-ketin kamera oldiga tuting — har biri avtomatik tasdiqlanadi.
          </p>
        </>
      )}
      {cameraError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Camera className="h-4 w-4" />
            Kamera ishlamayapti
          </div>
          {cameraError}
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="flex gap-2 border-t border-slate-100 pt-3">
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="SSCC kodni qo'lda kiriting"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          <ScanLine className="h-4 w-4" />
        </Button>
      </form>

      {log.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2 text-xs">
          {log.map((entry) => (
            <li key={entry.id} className={entry.ok ? "text-emerald-700" : "text-red-600"}>
              {entry.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
