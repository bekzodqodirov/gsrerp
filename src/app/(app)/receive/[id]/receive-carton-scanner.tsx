"use client";

import { CartonScanner } from "@/components/carton-scanner";
import { scanCartonForReceiving } from "@/lib/actions/cartons";

export function ReceiveCartonScanner({ loadingEventId }: { loadingEventId: string }) {
  return <CartonScanner onScan={(code) => scanCartonForReceiving(loadingEventId, code)} />;
}
