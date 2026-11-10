// Checks the exact staged content; never prints a credential or file contents.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "--cached", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const secrets = existsSync(".env.local")
  ? readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = line.match(
          /^\s*([A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z_]*)\s*=\s*(.*?)\s*$/,
        );
        if (!match) return [];
        const value = match[2].replace(/^['"]|['"]$/g, "");
        return value.length >= 12 ? [value] : [];
      })
  : [];
const patterns = [
  /AIza[\w-]{30,}/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[A-Z0-9]{16}/,
];
const forbidden =
  /(^|\/)(?:\.env(?!\.example$)|node_modules\/|\.next\/|test-results\/|\.codex\/|\.agents\/)|\.(?:pem|key|p12|pfx)$/;
const issues = files.flatMap((path) => {
  if (forbidden.test(path))
    return [{ path, reason: "private or generated file" }];
  const content = execFileSync("git", ["show", `:${path}`], {
    maxBuffer: 20 * 1024 * 1024,
  }).toString("utf8");
  return secrets.some((secret) => content.includes(secret)) ||
    patterns.some((pattern) => pattern.test(content))
    ? [{ path, reason: "possible credential" }]
    : [];
});
console.log(
  JSON.stringify(
    { stagedFiles: files.length, localSecretsChecked: secrets.length, issues },
    null,
    2,
  ),
);
process.exitCode = !files.length || issues.length ? 1 : 0;
