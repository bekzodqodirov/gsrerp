"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DetectorSupport = "supported" | "unsupported";

export default function ScanCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [support] = useState<DetectorSupport>(() =>
    typeof window !== "undefined" && "BarcodeDetector" in window ? "supported" : "unsupported"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (support !== "supported") return;

    let stream: MediaStream | undefined;
    let stopped = false;
    let rafId = 0;

    function goTo(rawValue: string) {
      try {
        const url = new URL(rawValue);
        router.push(url.pathname);
      } catch {
        router.push(`/scan/${encodeURIComponent(rawValue)}`);
      }
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
        } }).BarcodeDetector;
        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              stopped = true;
              stream?.getTracks().forEach((t) => t.stop());
              goTo(codes[0].rawValue);
              return;
            }
          } catch {
            // per-frame decode errors are expected while framing the code — ignore
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
  }, [support, router]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) router.push(`/scan/${encodeURIComponent(manualCode.trim())}`);
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-5 w-5 text-accent" />
            QR skanerlash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {support === "supported" && !cameraError && (
            <div className="overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="w-full" muted playsInline />
            </div>
          )}
          {support === "supported" && !cameraError && (
            <p className="text-center text-xs text-slate-500">
              Karobkadagi QR kodni kamera oldiga tuting — avtomatik ochiladi.
            </p>
          )}
          {(support === "unsupported" || cameraError) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Camera className="h-4 w-4" />
                Kamera bilan skanerlash ishlamayapti
              </div>
              {cameraError ?? "Bu brauzer ichki kamera skanerini qo'llab-quvvatlamaydi. Telefonning oddiy Kamera ilovasi bilan QR kodni skanerlang — u avtomatik shu sahifaga olib keladi."}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-slate-100 pt-3">
            <label className="block text-xs font-medium text-slate-500">Yoki partiya kodini qo&apos;lda kiriting</label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="partiya ID"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <Button type="submit" variant="secondary">
                O&apos;tish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
