import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const mode of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC12 server error hooks " + mode,
    async () => {
      const dir = resolve(".build", "hooks-" + process.pid + "-" + mode);
      try {
        await build(dir, mode, { client: [], server: ["tracks/frames/server-hooks.tsx"] });
        const module = await import(dir + "/server-hooks.js");
        await build(dir+"/ambient",mode,{client:[],server:["tracks/frames/server-hooks-ambient.ts"]});
        const external=await import(dir+"/ambient/server-hooks-ambient.js");
        const results = await module.run(external.configure);
        await Bun.write(
          "artifacts/server-hooks-" + mode + ".json",
          JSON.stringify(results, null, 2),
        );
        expect(results.filter((x: any) => x.error)).toEqual([]);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    30000,
  );
