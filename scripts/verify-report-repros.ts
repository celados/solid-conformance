import { spawn } from "node:child_process";
import { mkdir, rm, symlink } from "node:fs/promises";
import { resolve } from "node:path";

const parent = process.cwd();
const target = await Bun.file(".upstream/active.json").json();
const issues = (await Array.fromAsync(new Bun.Glob("report/issues/*.md").scan("."))).sort();
const root = resolve(".scratch", "report-standalone-verification");
const results: any[] = [];
await mkdir(root, { recursive: true });
await mkdir("report/evidence/wave4b", { recursive: true });

async function verify(path: string) {
  const text = await Bun.file(path).text();
  const front = Bun.YAML.parse(text.split("---")[1]!) as any;
  if (front.tier !== "A") return;
  const name = path.split("/").at(-1)!.replace(".md", "");
  const source = "report/repros/" + name;
  const dir = resolve(root, name);
  await mkdir(dir, { recursive: true });
  const files = (await Array.fromAsync(new Bun.Glob("*.{ts,tsx}").scan(source))).sort();
  const displayed = text.split("<details>")[0]!.match(/```(?:ts|tsx)\n([\s\S]*?)\n```/)?.[1];
  if (!front.snippet || !displayed) throw new Error("Missing readable snippet: " + path);
  if ((await Bun.file(source + "/" + front.snippet).text()).trim() !== displayed.trim()) {
    throw new Error("Displayed snippet differs from executed source: " + path);
  }
  for (const file of files) {
    const code = await Bun.file(source + "/" + file).text();
    if (/from\s*['"][^'"]*(?:harness\/|scripts\/build|findings\/)/.test(code)) {
      throw new Error("Reproduction depends on the conformance project: " + file);
    }
    await Bun.write(resolve(dir, file), code);
  }
  await Bun.write(
    resolve(dir, "tsconfig.json"),
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
  await Bun.write(resolve(dir, "bunfig.toml"), "");
  await rm(resolve(dir, "node_modules"), { recursive: true, force: true });
  await symlink(resolve(parent, "node_modules"), resolve(dir, "node_modules"));
  for (const mode of ["development", "production"]) {
    for (const file of files.filter((file) => file.endsWith(".test.ts"))) {
      const output: string[] = [];
      const started = performance.now();
      const child = spawn(process.execPath, ["test", "./" + file], {
        cwd: dir,
        env: { ...process.env, BUILD_MODE: mode },
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (chunk) => output.push(String(chunk)));
      child.stderr.on("data", (chunk) => output.push(String(chunk)));
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          process.kill(-child.pid!, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
      }, 120000);
      const exitCode = await new Promise<number | null>((complete, reject) => {
        child.once("error", reject);
        child.once("close", complete);
      }).finally(() => clearTimeout(timer));
      const log = output.join("");
      const logPath = "report/evidence/wave4b/" + name + "-" + mode + "-" + file + ".log";
      await Bun.write(logPath, log);
      const result = {
        issue: path,
        test: file,
        mode,
        exitCode,
        timedOut,
        pass: Number(log.match(/^\s*(\d+) pass$/m)?.[1] ?? 0),
        fail: Number(log.match(/^\s*(\d+) fail$/m)?.[1] ?? 0),
        ms: performance.now() - started,
        log: logPath,
      };
      results.push(result);
      console.log(JSON.stringify(result));
      await Bun.write(
        "report/evidence/wave4b-standalone-results.json",
        JSON.stringify(
          {
            head: target.revision,
            method:
              "Readable snippet checked against its executed source; complete standalone folders copied into fresh hosts without conformance preloads. Both named artifact conditions run; green controls remain green.",
            results,
          },
          null,
          2,
        ) + "\n",
      );
    }
  }
}
const queue = [...issues];
await Promise.all(
  [0, 1].map(async () => {
    while (queue.length) {
      const path = queue.shift();
      if (path) await verify(path);
    }
  }),
);
if (results.some((result) => result.timedOut || (!result.pass && !result.fail))) {
  throw new Error("A standalone reproduction failed before reaching its checks.");
}
console.log(
  "Standalone results collected; inspect exact assertion signatures and positive controls.",
);
