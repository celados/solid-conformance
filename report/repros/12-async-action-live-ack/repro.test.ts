import { test, expect } from "bun:test";
import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
test("06-actions-optimistic.md C166: await fire-and-forget send then until waits for the authoritative live echo", async () => {
  const packages = new Map<string, { path: string; exports: Record<string, any> }>();
  for (const name of ["solid-js", "@solidjs/signals"]) {
    const path = await realpath(resolve("node_modules", name));
    packages.set(name, { path, exports: (await Bun.file(path + "/package.json").json()).exports });
  }
  const built = await Bun.build({
    entrypoints: [resolve("./module.ts")],
    outdir: resolve(".build/finding053"),
    target: "bun",
    plugins: [
      {
        name: "actual-browser",
        setup(builder) {
          builder.onResolve({ filter: /^(solid-js|@solidjs\/signals)$/ }, (args) => {
            const pkg = packages.get(args.path)!,
              entry = pkg.exports["."],
              browser = entry.browser ?? entry,
              selected = browser[process.env.BUILD_MODE ?? "development"] ?? browser.default;
            return {
              path: resolve(
                pkg.path,
                typeof selected === "string" ? selected : (selected.import ?? selected.default),
              ),
            };
          });
        },
      },
    ],
  });
  expect(built.success).toBe(true);
  const r = await import(resolve(".build/finding053/module.js"));
  expect(await r.run()).toEqual({ beforeEcho: false, confirmed: true, error: undefined });
  expect(await r.run(false)).toEqual({ beforeEcho: false, confirmed: true, error: undefined });
}, 30000);
