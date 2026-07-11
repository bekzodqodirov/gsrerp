import { z } from "zod";

export const clientSchema = z.object({
  code: z.string().trim().min(1, "Kod majburiy").max(50),
  name: z.string().trim().min(1, "Nomi majburiy"),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const locationSchema = z.object({
  name: z.string().trim().min(1, "Nomi majburiy"),
  type: z.enum(["warehouse", "border_crossing", "customs"]),
  country: z.string().trim().min(1, "Davlat majburiy"),
});

export const truckSchema = z.object({
  code: z.string().trim().min(1, "Kod majburiy"),
  plateNumber: z.string().trim().optional(),
  currentLocationId: z.string().trim().optional(),
});

export const intakeBatchSchema = z.object({
  clientId: z.string().min(1, "Mijoz tanlanmagan"),
  locationId: z.string().min(1, "Joylashuv tanlanmagan"),
  intakeDate: z.string().min(1, "Sana majburiy"),
  productName: z.string().trim().optional(),
  packingType: z.enum(["carton", "woven_bag", "pallet", "other"]),
  lengthM: z.coerce.number().positive("Musbat son bo'lishi kerak"),
  widthM: z.coerce.number().positive("Musbat son bo'lishi kerak"),
  heightM: z.coerce.number().positive("Musbat son bo'lishi kerak"),
  packageCount: z.coerce.number().int().positive("Musbat butun son bo'lishi kerak"),
  unitQty: z.coerce.number().int().positive().optional().or(z.literal(undefined)),
  unitGrossWeightKg: z.coerce.number().positive().optional().or(z.literal(undefined)),
  costNotes: z.string().trim().optional(),
});

export const loadingEventSchema = z.object({
  truckId: z.string().min(1, "Mashina tanlanmagan"),
  loadedDate: z.string().min(1, "Sana majburiy"),
  fromLocationId: z.string().min(1, "Joylashuv tanlanmagan"),
  toLocationId: z.string().trim().optional(),
});

export const loadingLineItemSchema = z.object({
  loadingEventId: z.string().min(1),
  intakeBatchId: z.string().min(1, "Partiya tanlanmagan"),
  packageCountLoaded: z.coerce.number().int().refine((n) => n !== 0, "0 bo'lmasligi kerak"),
  note: z.string().trim().optional(),
});

export const loadingCostSchema = z.object({
  loadingEventId: z.string().min(1),
  costType: z.enum(["forklift", "customs", "tax_refund", "other"]),
  amountCny: z.coerce.number().positive("Musbat son bo'lishi kerak"),
  notes: z.string().trim().optional(),
});

export const deliveryReconciliationSchema = z.object({
  clientId: z.string().min(1, "Mijoz tanlanmagan"),
  reconDate: z.string().min(1, "Sana majburiy"),
  expectedPackageCount: z.coerce.number().int().positive(),
  confirmedPackageCount: z.coerce.number().int().nonnegative().optional().or(z.literal(undefined)),
  discrepancyNotes: z.string().trim().optional(),
});

export const userSchema = z.object({
  email: z.string().trim().email("Email noto'g'ri"),
  name: z.string().trim().min(1, "Ism majburiy"),
  role: z.enum(["admin", "warehouse", "logistics", "accounting"]),
  password: z.string().min(6, "Kamida 6 belgi"),
});
