// Build gate. Fails the build if the client source reintroduces either:
//   1. a NEXT_PUBLIC_ env var whose name implies a secret or funds destination
//      (ADDRESS|KEY|SECRET|TOKEN) — those ship to every visitor in plaintext, or
//   2. a banned compliance claim (BVN, licensed, custod*, "never holds").
// Runs on `prebuild`, so a regression is caught before it reaches Vercel.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const SECRET_VAR = /NEXT_PUBLIC_[A-Z0-9_]*(ADDRESS|KEY|SECRET|TOKEN)/;
const COMPLIANCE = /\bBVN\b|\blicensed\b|\bcustod|\bnever holds\b/i;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

const violations = [];
for (const root of ROOTS) {
  let files;
  try {
    files = walk(root);
  } catch {
    continue; // root may not exist
  }
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (SECRET_VAR.test(line)) {
        violations.push(`${file}:${i + 1}  client-shipped secret/address var: ${line.trim()}`);
      }
      if (COMPLIANCE.test(line)) {
        violations.push(`${file}:${i + 1}  banned compliance claim: ${line.trim()}`);
      }
    });
  }
}

if (violations.length) {
  console.error("\nForbidden content check failed:\n");
  for (const v of violations) console.error("  " + v);
  console.error(`\n${violations.length} violation(s). See scripts/check-forbidden.mjs.\n`);
  process.exit(1);
}
console.log("check-forbidden: clean");
