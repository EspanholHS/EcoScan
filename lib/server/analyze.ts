import sharp from "sharp";
import { z } from "zod";
import { analysisSchema, imageRequestSchema } from "../domain";
import { SYSTEM_PROMPT } from "../guidance";
import { PublicError } from "./guard";

export async function validateImage(input: unknown) {
  const parsed = imageRequestSchema.safeParse(input);
  if (!parsed.success)
    throw new PublicError(
      400,
      "INVALID_IMAGE",
      "Use uma fotografia JPG, PNG ou WebP válida.",
    );
  const bytes = Buffer.from(parsed.data.image, "base64");
  if (bytes.length > 2_000_000)
    throw new PublicError(413, "TOO_LARGE", "A imagem preparada excede 2 MB.");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 25_000_000,
      failOn: "warning",
      animated: false,
    });
    const metadata = await image.metadata();
    const format = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    }[parsed.data.mimeType];
    if (
      metadata.format !== format ||
      !metadata.width ||
      !metadata.height ||
      metadata.width < 32 ||
      metadata.height < 32 ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("invalid format");
    // Reencoda e remove metadados, sem escrever a foto em disco.
    const clean = await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82 })
      .toBuffer();
    return clean.toString("base64");
  } catch {
    throw new PublicError(
      400,
      "INVALID_IMAGE",
      "Não foi possível abrir esta fotografia. Use um JPG, PNG ou WebP estático e legível.",
    );
  }
}

const envelopeSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z.array(
              z.object({
                text: z.string().optional(),
                thought: z.boolean().optional(),
              }),
            ),
          })
          .optional(),
        finishReason: z.string().optional(),
      }),
    )
    .optional(),
});

export async function analyzeImage(
  image: string,
  options: {
    apiKey: string;
    model: string;
    fetcher?: typeof fetch;
    signal?: AbortSignal;
  },
) {
  if (!/^[a-zA-Z0-9._-]{3,100}$/.test(options.model))
    throw new PublicError(
      503,
      "CONFIGURATION",
      "O serviço de análise precisa ser configurado.",
    );
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`,
      {
        method: "POST",
        signal: options.signal ?? AbortSignal.timeout(40000),
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": options.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Identifique o resíduo principal nesta fotografia conforme o esquema.",
                },
                { inlineData: { mimeType: "image/jpeg", data: image } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 3000,
            ...(options.model.startsWith("gemini-2.5-")
              ? { thinkingConfig: { thinkingBudget: 512 } }
              : {}),
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(analysisSchema, {
              target: "draft-7",
            }),
          },
        }),
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new PublicError(
        504,
        "TIMEOUT",
        "A análise demorou mais que o esperado. Tente novamente.",
      );
    throw new PublicError(
      503,
      "CONNECTION",
      "Não foi possível conectar ao serviço de análise. Tente novamente em instantes.",
    );
  }
  if (!response.ok) {
    if (response.status === 429)
      throw new PublicError(
        429,
        "PROVIDER_LIMIT",
        "O limite do serviço de IA foi atingido. Aguarde e tente novamente.",
      );
    throw new PublicError(
      503,
      "PROVIDER_UNAVAILABLE",
      "O serviço de IA está indisponível. Verifique a configuração ou tente mais tarde.",
    );
  }
  try {
    const envelope = envelopeSchema.parse(await response.json());
    const candidate = envelope.candidates?.[0];
    if (candidate?.finishReason !== "STOP")
      throw new Error("incomplete response");
    const json = candidate.content?.parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");
    const result = analysisSchema.parse(JSON.parse(json ?? ""));
    // Some model responses double-escape Unicode inside otherwise valid JSON.
    const decodeUnicode = (value: string) =>
      value.replace(/\\u([\da-f]{4})/gi, (escape, hex: string) => {
        const code = Number.parseInt(hex, 16);
        return code >= 0x20 ? String.fromCharCode(code) : escape;
      });
    return analysisSchema.parse({
      ...result,
      object: decodeUnicode(result.object),
      material: decodeUnicode(result.material),
      observation: decodeUnicode(result.observation),
      uncertainty: decodeUnicode(result.uncertainty),
    });
  } catch {
    throw new PublicError(
      502,
      "INVALID_RESPONSE",
      "A IA não retornou uma identificação válida. Tente uma foto mais próxima e com boa luz.",
    );
  }
}
