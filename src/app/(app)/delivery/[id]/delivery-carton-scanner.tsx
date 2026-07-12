"use client";

import { CartonScanner } from "@/components/carton-scanner";
import { scanCartonForDelivery } from "@/lib/actions/cartons";

export function DeliveryCartonScanner({ reconciliationId }: { reconciliationId: string }) {
  return <CartonScanner onScan={(code) => scanCartonForDelivery(reconciliationId, code)} />;
}
