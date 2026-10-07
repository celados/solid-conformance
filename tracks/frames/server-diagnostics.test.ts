import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
// RFC 08 L571-625: same workload against dev, observe and production artifacts.
for (const variant of ["development", "observe", "production"] as BuildMode[]) {
  test(
    "RFC08 server error roads and teardown fields " + variant,
    async () => {
      const outdir = resolve(".build", "server-roads-" + process.pid + "-" + variant);
      try {
        await build(outdir, variant, {
          client: [],
          server: ["tracks/frames/server-diagnostics.tsx"],
        });
        const module = await import(outdir + "/server-diagnostics.js");
        const result = await module.run();
        await Bun.write(
          "artifacts/server-roads-" + variant + ".json",
          JSON.stringify(result, null, 2),
        );
        expect(result.filter((c: any) => c.error)).toEqual([]);
      } finally {
        await rm(outdir, { recursive: true, force: true });
      }
    },
    30000,
  );
}
