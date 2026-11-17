import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url).pathname;

function files(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) found.push(...files(path));
    else if (/\.(ts|css|html|md|svg|json|yml|txt)$/.test(name) || name === "LICENSE") found.push(path);
  }
  return found;
}

test("the app does not call the network, store data, or claim a model", () => {
  const source = files(join(root, "src"))
    .concat(files(join(root, "public")))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  const banned = [
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /sendBeacon/,
    /localStorage/,
    /sessionStorage/,
    /indexedDB/,
    /document\.cookie/,
    /google-analytics/,
    /googletagmanager/,
    /gtag\s*\(/,
    /innerHTML/,
    /outerHTML/,
    /insertAdjacentHTML/,
    /document\.write/,
    /eval\s*\(/,
    /new Function/,
    /powered by ai/i,
    /uses ai/i,
    /large language model/i,
    /openai/i,
    /gpt-4/i,
    /machine learning/i,
    /kiroween/i,
    /\bkiro\b/i,
    /0\.47/,
    /we guarantee/i,
    /ISO\s*9001/i,
    /testimonial/i,
    /leading manufacturer/i,
  ];
  for (const pattern of banned) assert.doesNotMatch(source, pattern, pattern.source);
  assert.match(source, /usesLanguageModel: false/);
  assert.match(source, /quantitiesAreCumulative: false/);
});

test("examples and docs do not carry the banned price, a 100-unit minimum, or a private address", () => {
  const corpus = files(root)
    .filter((path) => !path.includes(`${join("tests", "source-guard")}`))
    .map((path) => ({ path: relative(root, path), text: readFileSync(path, "utf8") }))
    .filter((file) => !file.path.startsWith("node_modules") && !file.path.startsWith("dist"));
  const all = corpus.map((file) => file.text).join("\n");
  assert.doesNotMatch(all, /0\.47/);
  assert.doesNotMatch(all, /moq[^.\n]{0,24}\b100\b/i);
  assert.doesNotMatch(all, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(all, /kiroween|\bkiro\b/i);
});
