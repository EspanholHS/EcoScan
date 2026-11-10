import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { POST } from "../app/api/analyze/route";
import { analyzeImage, validateImage } from "../lib/server/analyze";
import {
  boundedJson,
  PublicError,
  RequestGuard,
  validateOrigin,
} from "../lib/server/guard";

test("rota sem credenciais retorna 503 honesto, sem resultado simulado", async () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const jpeg = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "gray" },
    })
      .jpeg()
      .toBuffer();
    const response = await POST(
      new Request("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          host: "127.0.0.1:3000",
          origin: "http://127.0.0.1:3000",
        },
        body: JSON.stringify({
          mimeType: "image/jpeg",
          image: jpeg.toString("base64"),
        }),
      }),
    );
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.equal(data.error.code, "NOT_CONFIGURED");
    assert.equal(data.analysis, undefined);
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  }
});

test("timeout e modelo inválido falham sem expor dados do provedor", async () => {
  await assert.rejects(
    analyzeImage("x", { apiKey: "test-only", model: "../invalid" }),
    (e: unknown) => e instanceof PublicError && e.status === 503,
  );
  await assert.rejects(
    analyzeImage("x", {
      apiKey: "test-only",
      model: "test-model",
      fetcher: async () => {
        throw new DOMException("test", "TimeoutError");
      },
    }),
    (e: unknown) => e instanceof PublicError && e.status === 504,
  );
});

test("origem externa é bloqueada, mesma origem e cliente sem origin são aceitos", () => {
  assert.throws(
    () =>
      validateOrigin(
        new Request("https://ecoscan.test/api/analyze", {
          headers: { origin: "https://other.test" },
        }),
      ),
    (e: unknown) => e instanceof PublicError && e.status === 403,
  );
  validateOrigin(
    new Request("https://ecoscan.test/api/analyze", {
      headers: { origin: "https://ecoscan.test" },
    }),
  );
  validateOrigin(new Request("https://ecoscan.test/api/analyze"));
  validateOrigin(
    new Request("http://localhost:3000/api/analyze", {
      headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
    }),
  );
});
test("rate limit bloqueia sétima chamada e reseta após janela", () => {
  const guard = new RequestGuard();
  for (let i = 0; i < 6; i++) guard.enter("test", 1000)();
  assert.throws(
    () => guard.enter("test", 1001),
    (e: unknown) => e instanceof PublicError && e.status === 429,
  );
  const release = guard.enter("test", 62000);
  release();
  release();
});
test("limite simultâneo é liberado após término", () => {
  const guard = new RequestGuard();
  const a = guard.enter("a", 1);
  const b = guard.enter("b", 1);
  assert.throws(() => guard.enter("c", 1));
  a();
  const c = guard.enter("c", 1);
  b();
  c();
});
test("corpo grande, JSON inválido e formato de requisição incorreto são rejeitados", async () => {
  await assert.rejects(
    boundedJson(
      new Request("https://test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "123456789",
      }),
      5,
    ),
    (e: unknown) => e instanceof PublicError && e.status === 413,
  );
  await assert.rejects(
    boundedJson(
      new Request("https://test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    ),
    (e: unknown) => e instanceof PublicError && e.status === 400,
  );
  await assert.rejects(
    boundedJson(new Request("https://test", { method: "POST", body: "x" })),
    (e: unknown) => e instanceof PublicError && e.status === 415,
  );
});
test("imagem válida é decodificada e metadados são removidos; bytes disfarçados e formato divergente falham", async () => {
  const jpeg = await sharp({
    create: { width: 64, height: 64, channels: 3, background: "green" },
  })
    .jpeg()
    .withMetadata()
    .toBuffer();
  const sanitized = await validateImage({
    mimeType: "image/jpeg",
    image: jpeg.toString("base64"),
  });
  assert.equal(
    (await sharp(Buffer.from(sanitized, "base64")).metadata()).exif,
    undefined,
  );
  await assert.rejects(
    validateImage({ mimeType: "image/png", image: jpeg.toString("base64") }),
  );
  await assert.rejects(
    validateImage({
      mimeType: "image/jpeg",
      image: Buffer.from("isto não é uma imagem").toString("base64"),
    }),
  );
});

const payload = {
  status: "identified",
  object: "Lata",
  material: "Metal",
  category: "metal",
  observation: "Recipiente metálico.",
  uncertainty: "",
  condition: "unknown",
  hazard: "none",
};
test("contrato Gemini usa uma chamada multimodal e valida JSON (provedor isolado de teste)", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (_url, options) => {
    calls++;
    assert.ok(options?.headers);
    const body = JSON.parse(String(options?.body));
    assert.equal(body.contents[0].parts[1].inlineData.mimeType, "image/jpeg");
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(payload) }] },
        },
      ],
    });
  };
  const result = await analyzeImage("test-only", {
    apiKey: "fake-test-key",
    model: "test-model",
    fetcher,
  });
  assert.equal(calls, 1);
  assert.equal(result.category, "metal");
});
test("normaliza Unicode duplamente escapado sem interpretar caracteres de controle", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                text: JSON.stringify({
                  ...payload,
                  object: "Garrafa de \\u00e1gua",
                  material: "Pl\\u00e1stico",
                  observation: "R\\u00f3tulo e \\u000a literal.",
                }),
              },
            ],
          },
        },
      ],
    });
  const result = await analyzeImage("test-only", {
    apiKey: "fake-test-key",
    model: "test-model",
    fetcher,
  });
  assert.equal(result.object, "Garrafa de água");
  assert.equal(result.material, "Plástico");
  assert.equal(result.observation, "Rótulo e \\u000a literal.");
});
test("limite, falha de rede, resposta malformada e resposta truncada têm erros públicos seguros", async () => {
  const options = { apiKey: "private-test-key", model: "test-model" };
  await assert.rejects(
    analyzeImage("x", {
      ...options,
      fetcher: async () =>
        new Response("secret provider error", { status: 429 }),
    }),
    (e: unknown) =>
      e instanceof PublicError &&
      e.status === 429 &&
      !e.message.includes("secret"),
  );
  await assert.rejects(
    analyzeImage("x", {
      ...options,
      fetcher: async () => {
        throw new Error("secret");
      },
    }),
    (e: unknown) => e instanceof PublicError && e.status === 503,
  );
  await assert.rejects(
    analyzeImage("x", {
      ...options,
      fetcher: async () =>
        Response.json({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: "not JSON" }] },
            },
          ],
        }),
    }),
    (e: unknown) => e instanceof PublicError && e.status === 502,
  );
  await assert.rejects(
    analyzeImage("x", {
      ...options,
      fetcher: async () =>
        Response.json({
          candidates: [
            {
              finishReason: "MAX_TOKENS",
              content: { parts: [{ text: JSON.stringify(payload) }] },
            },
          ],
        }),
    }),
    (e: unknown) => e instanceof PublicError && e.status === 502,
  );
});
