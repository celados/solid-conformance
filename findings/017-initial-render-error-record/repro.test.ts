import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
test("The initial render failure must also reach the SSR structured diagnostic channel", async () => {
  const directory = resolve(".build", "finding017-" + process.pid);
  try {
    await build(directory, (process.env.BUILD_MODE ?? "development") as BuildMode, {
      client: [],
      server: ["findings/017-initial-render-error-record/server.ts"],
    });
    const module = await import(directory + "/server.js");
    const result = module.run();
    expect(result.hooks).toBe(1);
    expect(result.events).toBe(1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
