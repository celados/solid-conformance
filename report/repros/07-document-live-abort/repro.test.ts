import { test, expect } from "bun:test";
import { build, type BuildMode } from "./build";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
for (const mode of ["development", "observe", "production"] as BuildMode[])
  test("aborting a document then finishing its server source must not throw " + mode, async () => {
    const dir = resolve(".build", "finding049-" + process.pid + "-" + mode);
    try {
      await build(dir, mode, { client: [], server: ["./server.tsx"], serverComponents: true });
      const m = await import(dir + "/server.js");
      const control = await m.run(false);
      expect(control.closed).toBe(1);
      expect(control.html).toContain("1");
      const r = await m.run();
      expect(r.html).toContain("1");
      expect(r.closed).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
