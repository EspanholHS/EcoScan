import { z } from "zod";

export const CATEGORIES = [
  "plastico",
  "papel",
  "vidro",
  "metal",
  "organico",
  "eletronico",
  "outros",
] as const;
export const categorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof categorySchema>;
export const CATEGORY: Record<
  Category,
  { label: string; color: string; short: string }
> = {
  plastico: { label: "Plástico", short: "PL", color: "#577d69" },
  papel: { label: "Papel / papelão", short: "PA", color: "#b79870" },
  vidro: { label: "Vidro", short: "VI", color: "#749ba1" },
  metal: { label: "Metal", short: "ME", color: "#8b92a0" },
  organico: { label: "Orgânico", short: "OR", color: "#9b8846" },
  eletronico: { label: "Eletrônico", short: "EL", color: "#9785a3" },
  outros: { label: "Outros / não identificado", short: "OU", color: "#9c9b91" },
};

export const analysisSchema = z
  .object({
    status: z.enum(["identified", "ambiguous", "multiple", "unrecognized"]),
    object: z.string().trim().min(2).max(100),
    material: z.string().trim().min(2).max(140),
    category: categorySchema,
    observation: z.string().trim().min(2).max(450),
    uncertainty: z.string().trim().max(350),
    condition: z.enum(["clean", "dirty", "unknown"]),
    itemType: z
      .enum([
        "plastic_bottle",
        "beverage_can",
        "paper",
        "portable_battery",
        "other",
      ])
      .optional(),
    visibleState: z
      .enum(["intact", "crushed", "torn", "leaking", "damaged", "unknown"])
      .optional(),
    hazard: z.enum([
      "none",
      "battery",
      "electronic",
      "chemical",
      "sharp",
      "medical",
      "unknown",
    ]),
  })
  .strict();
export type Analysis = z.infer<typeof analysisSchema>;

export const recordSchema = z
  .object({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    analysis: analysisSchema,
    originalCategory: categorySchema,
    finalCategory: categorySchema,
    corrected: z.boolean(),
    durationMs: z.number().int().min(0).max(180000),
  })
  .strict()
  .refine(
    (r) => r.corrected === (r.originalCategory !== r.finalCategory),
    "Correção inconsistente",
  )
  .refine(
    (r) => r.originalCategory === r.analysis.category,
    "Categoria original inconsistente",
  )
  .refine(
    (r) =>
      r.analysis.status === "identified" || r.analysis.status === "ambiguous",
    "Imagem sem identificação",
  );
export type AnalysisRecord = z.infer<typeof recordSchema>;
export const historySchema = z
  .object({ version: z.literal(1), records: z.array(recordSchema).max(1000) })
  .strict();
export const HISTORY_KEY = "ecoscan.history.v1";

export const responseSchema = z.object({
  analysis: analysisSchema,
  durationMs: z.number().int().nonnegative().max(180000),
});
export const imageRequestSchema = z
  .object({
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    image: z
      .string()
      .min(16)
      .max(2_800_000)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })
  .strict();

export function correctRecord(
  record: AnalysisRecord,
  category: Category,
): AnalysisRecord {
  return {
    ...record,
    finalCategory: category,
    corrected: category !== record.originalCategory,
  };
}

export function statistics(records: AnalysisRecord[]) {
  const corrected = records.filter((r) => r.corrected).length;
  return {
    total: records.length,
    corrected,
    correctionRate: records.length ? (corrected / records.length) * 100 : 0,
    averageMs: records.length
      ? records.reduce((sum, r) => sum + r.durationMs, 0) / records.length
      : 0,
    categories: CATEGORIES.map((key) => ({
      key,
      ...CATEGORY[key],
      count: records.filter((r) => r.finalCategory === key).length,
    })),
  };
}

export function temporalData(records: AnalysisRecord[]) {
  if (!records.length)
    return {
      unit: "day",
      points: [] as { label: string; count: number; key: string }[],
    };
  const sorted = [...records].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const first = new Date(sorted[0].createdAt);
  const last = new Date(sorted[sorted.length - 1].createdAt);
  const sameDay = first.toDateString() === last.toDateString();
  const monthly = (last.getTime() - first.getTime()) / 86400000 > 60;
  const unit = sameDay ? "hour" : monthly ? "month" : "day";
  const keyFor = (date: Date) =>
    unit === "hour"
      ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
      : unit === "month"
        ? `${date.getFullYear()}-${date.getMonth()}`
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const counts = new Map<string, number>();
  for (const r of records) {
    const key = keyFor(new Date(r.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cursor = new Date(first);
  if (unit === "hour") cursor.setMinutes(0, 0, 0);
  else if (unit === "month") {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
  } else cursor.setHours(0, 0, 0, 0);
  const points: { label: string; count: number; key: string }[] = [];
  while (cursor <= last && points.length < 1200) {
    const key = keyFor(cursor);
    const label =
      unit === "hour"
        ? `${String(cursor.getHours()).padStart(2, "0")}h`
        : cursor.toLocaleDateString(
            "pt-BR",
            unit === "month"
              ? { month: "short", year: "2-digit" }
              : { day: "2-digit", month: "short" },
          );
    points.push({ label, key, count: counts.get(key) ?? 0 });
    if (unit === "hour") cursor.setHours(cursor.getHours() + 1);
    else if (unit === "month") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return { unit, points };
}
