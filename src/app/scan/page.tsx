"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScanCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const router = useRouter();

  useEffect(() => {
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
              stopped = true;
              stream?.getTracks().forEach((t) => t.stop());
              goTo(result.data);
              return;
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
  }, [router]);

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
          {!cameraError && (
            <>
              <div className="overflow-hidden rounded-lg bg-black">
                <video ref={videoRef} className="w-full" muted playsInline />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-center text-xs text-slate-500">
                Karobkadagi QR kodni kamera oldiga tuting — avtomatik ochiladi.
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
