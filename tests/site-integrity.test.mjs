import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = readFileSync(new URL("../src/data.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");

test("redesign preserves the original six featured projects and repository destinations", () => {
  const featured = data.slice(data.indexOf("export const projects = ["));
  const names = [...featured.matchAll(/^\s+name: "([^"]+)",/gm)].map(match => match[1]);
  assert.deepEqual(names, [
    "Sistema VidaViva", "AutoHighlights", "OOP-Project (LAN Messaging)",
    "LockText", "Library System", "ConHacks 2025 – AI Lab Report Analyzer"
  ]);
  for (const destination of [
    "Pichara/Sistema-VidaViva", "Pichara/AutoHighlights", "Pichara/OOP-Project",
    "Pichara/LockText", "https://github.com/Pichara", "Pichara/ConHacks-2025"
  ]) assert.ok(featured.includes(destination), destination);
});

test("Matrix canvas is mounted globally and PR checks never deploy", () => {
  assert.match(app, /<MatrixRain\s*\/>/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
});

test("professional timeline includes publicly confirmed Delta Elevator co-op", () => {
  assert.match(data, /IS Programmer.*Full-Stack Developer/);
  assert.match(data, /Delta Elevator Co\. Ltd\./);
});
