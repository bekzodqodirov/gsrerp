// Derives a HOLAT-style stage label from a batch's current physical location + in-transit flag,
// matching the historical tracking sheet's status column (Qashqarda / bojxonada / yo'lda / ...).

type LocationLike = { name: string; type: "warehouse" | "border_crossing" | "customs" };

export function stageLabel(currentLocation: LocationLike, inTransit: boolean): string {
  if (inTransit) return `Yo'lda (${currentLocation.name} orqali)`;
  if (currentLocation.type === "customs") return `Bojxonada (${currentLocation.name})`;
  if (currentLocation.type === "border_crossing") return `${currentLocation.name}da`;
  return `Omborda (${currentLocation.name})`;
}

export function stageTone(currentLocation: LocationLike, inTransit: boolean): "amber" | "blue" | "green" | "slate" {
  if (inTransit) return "blue";
  if (currentLocation.type === "customs") return "amber";
  if (currentLocation.type === "border_crossing") return "slate";
  return "green";
}
