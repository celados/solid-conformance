import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { build } from "./build";
test("valid cookie name __proto__ round trips", async () => {
  const dir = resolve("dist");
  await build(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: [],
    server: ["module.ts"],
  });
  const runtime = await import(dir + "/module.js");
  const cookies = runtime.parse();
  expect(Object.hasOwn(cookies, "__proto__")).toBe(true);
  expect(cookies["__proto__"]).toBe("x");
});
