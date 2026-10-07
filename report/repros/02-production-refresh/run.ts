import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

const target = process.argv[2];
const built = process.argv[3];
if (!["rc13", "next"].includes(target ?? "") || (target === "next" && !built)) {
  throw new Error("Usage: bun run run.ts rc13 | next /absolute/path/to/built/solid");
}
const source = dirname(import.meta.path);
const host = await mkdtemp(resolve(tmpdir(), "solid-repro-"));
async function run(command: string[], env = process.env) {
  const child = Bun.spawn(command, { cwd: host, env, stdout: "inherit", stderr: "inherit" });
  return await child.exited;
}
try {
  for (const file of await Array.fromAsync(new Bun.Glob("*.{ts,tsx}").scan(source))) {
    if (file !== "run.ts") await Bun.write(resolve(host, file), Bun.file(resolve(source, file)));
  }
  await Bun.write(
    resolve(host, "package.json"),
    JSON.stringify({ name: "solid-minimal-repro", type: "module", private: true }),
  );
  await Bun.write(resolve(host, "bunfig.toml"), "");
  await Bun.write(
    resolve(host, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "preserve",
        jsxImportSource: "@solidjs/web",
        types: ["bun"],
      },
    }),
  );
  const packages = [
    "solid-js",
    "@solidjs/web",
    "@solidjs/signals",
    "@solidjs/compiler",
    "@solidjs/diagnostics",
  ].map((name) => name + "@2.0.0-rc.13");
  if (await run([process.execPath, "add", "--exact", ...packages]))
    throw new Error("Solid installation failed");
  if (await run([process.execPath, "add", "-d", "playwright"]))
    throw new Error("Playwright installation failed");
  if (target === "next" && (await run([process.execPath, "run", "link-head.ts", resolve(built!)])))
    throw new Error("Linking the built next checkout failed");
  const mode = process.env.BUILD_MODE ?? "production";
  console.log("Target: " + target + "; build: " + mode + "; isolated host: " + host);
  let failed = false;
  for (const file of (await Array.fromAsync(new Bun.Glob("*.test.ts").scan(host))).sort()) {
    if (await run([process.execPath, "test", "./" + file], { ...process.env, BUILD_MODE: mode }))
      failed = true;
  }
  process.exitCode = failed ? 1 : 0;
} finally {
  await rm(host, { recursive: true, force: true });
}
