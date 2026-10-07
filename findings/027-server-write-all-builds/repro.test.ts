import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
test("RFC11 setter warning ships in every server build", async () => {
  const dir = resolve(".build", "finding027-" + process.pid);
  try {
    await build(dir, (process.env.BUILD_MODE ?? "production") as BuildMode, {
      client: [],
      server: ["findings/027-server-write-all-builds/server.ts"],
    });
    const module = await import(dir + "/server.js");
    const result = await module.run();
    expect(result.html).toContain("1");
    expect(result.count).toBe(1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
