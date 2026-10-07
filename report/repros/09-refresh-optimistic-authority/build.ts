import { transform } from "@solidjs/compiler";
import { realpath } from "node:fs/promises";
import { resolve } from "node:path";

type ExportValue = string | Record<string, unknown>;
function selectExport(value: unknown, conditions: Set<string>): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  for (const [key, child] of Object.entries(value))
    if (conditions.has(key)) {
      const selected = selectExport(child, conditions);
      if (selected) return selected;
    }
}
export type BuildMode = "development" | "production" | "observe";
export async function build(
  outdir = ".build",
  variant: BuildMode,
  entries: { client: string[]; server: string[]; serverComponents?: boolean },
) {
  const packages = new Map<string, { directory: string; exports: Record<string, ExportValue> }>();
  for (const name of ["solid-js", "@solidjs/signals", "@solidjs/web", "@solidjs/diagnostics"]) {
    const directory = await realpath(resolve("node_modules", name));
    const pkg = await Bun.file(`${directory}/package.json`).json();
    packages.set(name, { directory, exports: pkg.exports });
  }
  for (const mode of ["client", "server"] as const) {
    if (entries?.[mode].length === 0) continue;
    const conditions = new Set([
      mode === "client" ? "browser" : "node",
      variant,
      "import",
      "default",
    ]);
    const result = await Bun.build({
      metafile: true,
      entrypoints: entries![mode],
      outdir,
      naming: "[name].js",
      splitting: mode === "client",
      target: mode === "client" ? "browser" : "bun",
      conditions: [variant],
      define: { "process.env.NODE_ENV": JSON.stringify(variant) },

      plugins: [
        {
          name: "solid",
          setup(builder) {
            // Pin consumer imports to one built package graph. Upstream's internal tsconfig
            // aliases point at source and otherwise mix source with distribution exports.
            builder.onResolve(
              {
                filter: /^(solid-js|@solidjs\/(signals|web|diagnostics))(\/.*)?$/,
              },
              (args) => {
                const name = args.path.startsWith("@")
                  ? args.path.split("/").slice(0, 2).join("/")
                  : "solid-js";
                const pkg = packages.get(name)!;
                const subpath = args.path.slice(name.length);
                const key = subpath ? "." + subpath : ".";
                const file = selectExport(pkg.exports[key], conditions);
                if (!file) throw new Error(`Missing runtime export: ${args.path} (${mode})`);
                return { path: resolve(pkg.directory, file) };
              },
            );
            builder.onLoad({ filter: /\.tsx$/ }, async (args) => ({
              contents: transform(await Bun.file(args.path).text(), {
                filename: args.path,
                generate: mode === "client" ? "dom" : "ssr",
                hydratable: true,
                dev: variant === "development",
                ...(entries?.serverComponents ? { serverComponents: true } : {}),
              }).code,
              loader: "ts",
            }));
          },
        },
      ],
    });
    if (!result.success) throw new AggregateError(result.logs, `Build failed: ${mode}`);
    await Bun.write(
      resolve(outdir, `${mode}-metafile.json`),
      JSON.stringify(result.metafile, null, 2),
    );
  }
}
