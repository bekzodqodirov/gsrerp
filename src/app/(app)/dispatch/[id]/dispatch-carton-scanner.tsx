"use client";

import { CartonScanner } from "@/components/carton-scanner";
import { scanCartonForLoading } from "@/lib/actions/cartons";

export function DispatchCartonScanner({ loadingEventId }: { loadingEventId: string }) {
  return <CartonScanner onScan={(code) => scanCartonForLoading(loadingEventId, code)} />;
}
