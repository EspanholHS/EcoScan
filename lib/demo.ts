import type { AnalysisRecord } from "./domain";

// Cenário exclusivo de apresentação, nunca gravado no histórico local.
export function demoRecords(now = new Date()): AnalysisRecord[] {
  const examples = [
    ["Garrafa de bebida", "plastico", "Plástico aparente"],
    ["Caixa de embalagem", "papel", "Papelão"],
    ["Lata de bebida", "metal", "Alumínio aparente"],
    ["Pote de conserva", "vidro", "Vidro aparente"],
    ["Casca de banana", "organico", "Matéria orgânica"],
    ["Cabo de carregamento", "eletronico", "Materiais mistos"],
  ] as const;
  return Array.from({ length: 24 }, (_, i) => {
    const [object, category, material] =
      examples[(i * 7 + Math.floor(i / 4)) % examples.length];
    const date = new Date(now.getTime() - i * 7 * 60 * 60 * 1000);
    const corrected = i % 7 === 0;
    const originalCategory = corrected ? "outros" : category;
    return {
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      createdAt: date.toISOString(),
      originalCategory,
      finalCategory: category,
      corrected,
      durationMs: 2400 + i * 137,
      analysis: {
        status: "identified",
        object,
        category: originalCategory,
        material,
        observation: "Registro simulado para explorar o painel.",
        uncertainty: "Dado demonstrativo, sem análise de imagem.",
        condition: "unknown",
        hazard: category === "eletronico" ? "electronic" : "none",
      },
    };
  });
}
