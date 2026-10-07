import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const variant of ["development", "observe", "production"] as BuildMode[])
  test("RFC08 boundary and render timing record contracts " + variant, async () => {
    const dir = resolve(".build", "boundary-records-" + process.pid + "-" + variant);
    try {
      await build(dir, variant, { client: [], server: ["tracks/frames/boundary-records.tsx"] });
      const module = await import(dir + "/boundary-records.js");
      const results = await module.run();
      await Bun.write(
        "artifacts/boundary-records-" + variant + ".json",
        JSON.stringify({ results, records: module.evidence }, null, 2),
      );
      expect(results.filter((r: any) => r.error)).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
