import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build } from "./build";
// documentation/solid-2.0/08-dev-diagnostics.md L674: resolver failure is reported,
// while server HTML still renders. A sync throw and rejected Promise have one contract.
test("a failed lazy asset resolver preserves server component HTML", async () => {
  const dir = resolve(".build", "sync-resolver-" + process.pid);
  await build(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: [],
    server: ["./server.tsx"],
  });
  try {
    const { sample } = await import(dir + "/server.js");
    expect(await sample(false)).toEqual({ rendered: true, error: null });
    expect(await sample(true)).toEqual({ rendered: true, error: null });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
