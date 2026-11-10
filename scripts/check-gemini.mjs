// Diagnóstico explícito. Nunca imprime a chave ou o corpo bruto do provedor.
import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY ausente.");
  process.exit(1);
}
const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models",
  {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
    signal: AbortSignal.timeout(20000),
  },
);
const data = await response.json();
console.log(
  JSON.stringify(
    {
      status: response.status,
      models: data.models
        ?.filter((m) =>
          m.supportedGenerationMethods?.includes("generateContent"),
        )
        .map((m) => m.name),
      errorStatus: data.error?.status,
      reasons: data.error?.details?.map((d) => d.reason).filter(Boolean),
    },
    null,
    2,
  ),
);
process.exitCode = response.ok ? 0 : 1;
