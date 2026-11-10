import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log("Chave ausente; verificação literal não executada.");
  process.exit(1);
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const exposed = files(".next/static").filter((path) =>
  readFileSync(path).includes(Buffer.from(key)),
);
console.log(
  JSON.stringify(
    {
      clientBundleContainsCredential: exposed.length > 0,
      affectedFiles: exposed,
    },
    null,
    2,
  ),
);
process.exitCode = exposed.length ? 1 : 0;
