import { createHash } from "node:crypto";

export class PublicError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Proteção deliberadamente limitada à instância serverless. Não é uma quota global.
export class RequestGuard {
  private buckets = new Map<string, { count: number; until: number }>();
  private hourly = { count: 0, until: 0 };
  private active = 0;
  enter(identity: string, now = Date.now()) {
    for (const [key, b] of this.buckets)
      if (b.until <= now) this.buckets.delete(key);
    if (this.buckets.size > 500)
      throw new PublicError(
        429,
        "RATE_LIMIT",
        "Muitas solicitações. Tente novamente em um minuto.",
      );
    const key = createHash("sha256").update(identity).digest("hex");
    const bucket = this.buckets.get(key) ?? { count: 0, until: now + 60000 };
    if (this.hourly.until <= now)
      this.hourly = { count: 0, until: now + 3600000 };
    if (bucket.count >= 6 || this.hourly.count >= 40 || this.active >= 2)
      throw new PublicError(
        429,
        "RATE_LIMIT",
        "O laboratório está ocupado. Aguarde um minuto e tente novamente.",
      );
    bucket.count++;
    this.hourly.count++;
    this.active++;
    this.buckets.set(key, bucket);
    let released = false;
    return () => {
      if (!released) {
        this.active--;
        released = true;
      }
    };
  }
}

export function validateOrigin(request: Request, configuredOrigin?: string) {
  const origin = request.headers.get("origin");
  // Next pode reconstruir request.url com localhost atrás do servidor local.
  // Host é o destino efetivo da requisição do navegador; em produção APP_ORIGIN
  // permite fixar explicitamente a origem canônica.
  const url = new URL(request.url);
  const expected =
    configuredOrigin ||
    `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (
    (origin && origin !== expected) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new PublicError(
      403,
      "ORIGIN",
      "Esta solicitação precisa partir do EcoScan.",
    );
}

export async function boundedJson(
  request: Request,
  limit = 3_000_000,
): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new PublicError(
      415,
      "FORMAT",
      "Envie uma imagem no formato indicado.",
    );
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > limit)
    throw new PublicError(
      413,
      "TOO_LARGE",
      "A imagem preparada é muito grande. Escolha outra fotografia.",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new PublicError(400, "EMPTY", "Selecione uma fotografia.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new PublicError(
          413,
          "TOO_LARGE",
          "A imagem preparada é muito grande.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new PublicError(
      400,
      "INVALID_JSON",
      "Não foi possível ler a imagem enviada.",
    );
  }
}
