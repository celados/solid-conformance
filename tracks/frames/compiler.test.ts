import { test, expect } from "bun:test";
import { transformDirectives } from "@solidjs/compiler";
const options = { filename: "/project/api.ts", root: "/project", env: "development" } as const;
test("RFC10 function directive preserves wrappers and removes private-only imports", () => {
  const source = `import { db } from './private-db'; import { GET } from '@solidjs/web/server-functions'; export const read = GET(async (id:number) => { "use server"; return db.get(id); });`;
  const client = transformDirectives(source, { ...options, mode: "client" });
  const server = transformDirectives(source, { ...options, mode: "server" });
  expect(client.valid).toBe(true);
  expect(client.code).toContain("GET(");
  expect(server.code).toContain("GET(");
  expect(client.code).not.toContain("private-db");
  expect(client.code).not.toContain("db.get");
  expect(server.code).toContain("registerServerReference");
  expect(client.functions.map((f) => f.id)).toEqual(server.functions.map((f) => f.id));
});
test("RFC10 module directive registers evaluated exports and keeps wrappers server-only", () => {
  const source = `"use server"; import { withValidation } from './private-validation'; async function fn(n:number){ return n+1; } export const read=withValidation(fn); export { read as alias }; export default (()=>3);`;
  const client = transformDirectives(source, { ...options, mode: "client" });
  const server = transformDirectives(source, { ...options, mode: "server" });
  expect(client.code).not.toContain("private-validation");
  expect(client.code).not.toContain("withValidation");
  expect(server.code).toContain("withValidation(fn)");
  expect(server.code).toContain("registerServerReference");
  expect(client.functions.length).toBeGreaterThanOrEqual(2);
  expect(client.functions.map((f) => f.id)).toEqual(server.functions.map((f) => f.id));
});
test("RFC10 body edits and declaration reordering keep identity; only dev output emits names", () => {
  const a = transformDirectives(
    'export function one(){"use server";return 1} export function two(){"use server";return 2}',
    { ...options, mode: "client" },
  );
  const b = transformDirectives(
    'export function two(){"use server";return 20} export function one(){"use server";return 10}',
    { ...options, mode: "client", env: "production" },
  );
  expect(a.functions.map((f) => f.id).sort()).toEqual(b.functions.map((f) => f.id).sort());
  expect(a.code).toContain('"one"');
  expect(b.code).not.toContain(', "one"');
});
