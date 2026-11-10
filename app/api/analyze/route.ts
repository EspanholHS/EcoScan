import { analyzeImage, validateImage } from "@/lib/server/analyze";
import {
  boundedJson,
  PublicError,
  RequestGuard,
  validateOrigin,
} from "@/lib/server/guard";

export const runtime = "nodejs";
export const maxDuration = 60;
const guard = new RequestGuard();

export async function POST(request: Request) {
  let release: (() => void) | undefined;
  const started = Date.now();
  try {
    validateOrigin(request, process.env.APP_ORIGIN);
    const identity =
      process.env.VERCEL === "1"
        ? request.headers
            .get("x-vercel-forwarded-for")
            ?.split(",")[0]
            ?.trim() || "unavailable"
        : "local";
    release = guard.enter(identity);
    const input = await boundedJson(request);
    const image = await validateImage(input);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      throw new PublicError(
        503,
        "NOT_CONFIGURED",
        "A análise por IA ainda não está configurada. Adicione a chave Gemini no servidor para começar.",
      );
    const analysis = await analyzeImage(image, {
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });
    return Response.json(
      { analysis, durationMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const known = error instanceof PublicError;
    return Response.json(
      {
        error: {
          code: known ? error.code : "INTERNAL",
          message: known
            ? error.message
            : "Não foi possível concluir a análise. Tente novamente.",
        },
      },
      {
        status: known ? error.status : 500,
        headers: {
          "Cache-Control": "no-store",
          ...(known && error.status === 429 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  } finally {
    release?.();
  }
}
