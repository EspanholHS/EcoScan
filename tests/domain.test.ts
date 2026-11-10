import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analysisSchema,
  correctRecord,
  historySchema,
  statistics,
  temporalData,
  type Analysis,
  type AnalysisRecord,
} from "../lib/domain";
import { conditionLabel, guidance } from "../lib/guidance";
import { demoRecords } from "../lib/demo";

const analysis: Analysis = {
  status: "identified",
  object: "Garrafa",
  material: "Plástico aparente",
  category: "plastico",
  observation: "Recipiente transparente.",
  uncertainty: "Não confirma composição.",
  condition: "unknown",
  hazard: "none",
};
function record(date = "2026-11-07T12:00:00.000Z"): AnalysisRecord {
  return {
    id: "07839aa8-876e-4d2c-9c08-b88af53eb6e1",
    createdAt: date,
    analysis,
    originalCategory: "plastico",
    finalCategory: "plastico",
    corrected: false,
    durationMs: 2000,
  };
}

test("resposta com confiança numérica ou categoria desconhecida é rejeitada", () => {
  assert.equal(
    analysisSchema.safeParse({ ...analysis, confidence: 99 }).success,
    false,
  );
  assert.equal(
    analysisSchema.safeParse({ ...analysis, category: "reciclavel" }).success,
    false,
  );
});
test("correção move contagem de categoria e percentual sem duplicar análises", () => {
  const corrected = correctRecord(record(), "vidro");
  const stats = statistics([corrected]);
  assert.equal(stats.total, 1);
  assert.equal(stats.correctionRate, 100);
  assert.equal(stats.categories.find((c) => c.key === "plastico")?.count, 0);
  assert.equal(stats.categories.find((c) => c.key === "vidro")?.count, 1);
  assert.equal(correctRecord(corrected, "plastico").corrected, false);
});
test("histórico não aceita imagens, categorias inconsistentes ou resultados sem objeto", () => {
  assert.equal(
    historySchema.safeParse({
      version: 1,
      records: [{ ...record(), image: "data:image/jpeg;base64,secret" }],
    }).success,
    false,
  );
  assert.equal(
    historySchema.safeParse({
      version: 1,
      records: [{ ...record(), corrected: true }],
    }).success,
    false,
  );
  assert.equal(
    historySchema.safeParse({
      version: 1,
      records: [{ ...record(), analysis: { ...analysis, status: "multiple" } }],
    }).success,
    false,
  );
});
test("sem registros, métricas são zero e não NaN", () => {
  const stats = statistics([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.correctionRate, 0);
  assert.equal(stats.averageMs, 0);
});
test("evolução inclui intervalos vazios e adapta hora, dia ou mês", () => {
  const hourly = temporalData([
    record("2026-11-07T12:00:00Z"),
    record("2026-11-07T14:00:00Z"),
  ]);
  assert.equal(hourly.unit, "hour");
  assert.deepEqual(
    hourly.points.map((p) => p.count),
    [1, 0, 1],
  );
  const daily = temporalData([
    record("2026-11-01T12:00:00Z"),
    record("2026-11-03T12:00:00Z"),
  ]);
  assert.equal(daily.unit, "day");
  assert.deepEqual(
    daily.points.map((p) => p.count),
    [1, 0, 1],
  );
  assert.equal(
    temporalData([
      record("2026-01-01T12:00:00Z"),
      record("2026-11-01T12:00:00Z"),
    ]).unit,
    "month",
  );
});
test("corrigir pilha para plástico não remove encaminhamento especializado", () => {
  const rule = guidance({ ...analysis, hazard: "battery" }, "plastico");
  assert.equal(
    rule.destination,
    "Leve a um ponto de coleta de pilhas e baterias",
  );
  assert.match(rule.caution, /não elimina/);
});
test("material com risco desconhecido não ganha coleta comum por correção", () => {
  assert.equal(
    guidance({ ...analysis, hazard: "unknown" }, "papel").destination,
    "Confirme antes de descartar",
  );
});

test("garrafa recebe ação direta e correção atualiza o destino", () => {
  assert.match(
    guidance(analysis, "plastico").destination,
    /reciclagem de plástico/,
  );
  assert.match(guidance(analysis, "metal").destination, /reciclagem de metal/);
});

test("pilha mantém coleta própria mesmo com categoria metálica ou correção", () => {
  const battery: Analysis = {
    ...analysis,
    category: "metal",
    itemType: "portable_battery",
    hazard: "battery",
    visibleState: "intact",
  };
  for (const category of ["metal", "plastico", "outros"] as const) {
    const rule = guidance(battery, category);
    assert.match(rule.destination, /ponto de coleta de pilhas/);
    assert.equal(rule.steps.length, 3);
    assert.match(rule.steps[0], /Não coloque no lixo comum/);
    assert.ok(
      "collection" in rule && rule.collection?.url.startsWith("https://"),
    );
  }
  assert.doesNotMatch(conditionLabel(battery), /Confira o interior/);
  const damaged = guidance({ ...battery, visibleState: "leaking" }, "metal");
  assert.match(damaged.destination, /Contate/);
  assert.match(damaged.steps[1], /Não toque em vazamentos/);
});

test("garrafa adapta dicas ao estado e desativa perfil após correção ou risco", () => {
  const bottle: Analysis = {
    ...analysis,
    itemType: "plastic_bottle",
    visibleState: "crushed",
    condition: "dirty",
  };
  const rule = guidance(bottle, "plastico");
  assert.equal(rule.steps.length, 3);
  assert.match(rule.steps[0], /excesso de resíduos/);
  assert.match(rule.steps[1], /já está amassada/);
  assert.doesNotMatch(guidance(bottle, "papel").steps.join(" "), /garrafa/);
  assert.equal(
    guidance({ ...bottle, hazard: "chemical" }, "plastico").destination,
    "Descarte especializado",
  );
  assert.doesNotMatch(
    guidance({ ...bottle, status: "ambiguous" }, "plastico").steps.join(" "),
    /amasse/,
  );
});

test("identificação ambígua pede confirmação antes de recomendar reciclagem", () => {
  const ambiguous: Analysis = { ...analysis, status: "ambiguous" };
  assert.equal(
    guidance(ambiguous, "plastico").destination,
    "Confirme o material antes de separar",
  );
  assert.match(guidance(ambiguous, "papel").destination, /papel seco/);
  assert.equal(
    guidance({ ...ambiguous, hazard: "battery" }, "plastico").destination,
    "Leve a um ponto de coleta de pilhas e baterias",
  );
});
test("demonstração respeita schema, mas não grava dados reais", () => {
  const data = demoRecords(new Date("2026-11-07T21:00:00Z"));
  assert.equal(data.length, 24);
  assert.equal(
    historySchema.safeParse({ version: 1, records: data }).success,
    true,
  );
  assert.equal(statistics(data).corrected, 4);
});
