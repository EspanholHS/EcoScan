// Usa a API real e pode consumir quota. Não salva a foto no aplicativo.
// Uso: node scripts/smoke-live.mjs caminho/para/foto.jpg
import { readFileSync } from "node:fs";
import sharp from "sharp";

const path = process.argv[2];
if (!path) {
  console.error("Informe uma fotografia de teste.");
  process.exit(1);
}
const image = await sharp(readFileSync(path))
  .rotate()
  .resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: true,
  })
  .jpeg({ quality: 82 })
  .toBuffer();
const response = await fetch("http://127.0.0.1:3000/api/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "http://127.0.0.1:3000",
  },
  body: JSON.stringify({
    mimeType: "image/jpeg",
    image: image.toString("base64"),
  }),
  signal: AbortSignal.timeout(55000),
});
const data = await response.json();
console.log(JSON.stringify({ httpStatus: response.status, ...data }, null, 2));
process.exitCode = response.ok ? 0 : 1;
