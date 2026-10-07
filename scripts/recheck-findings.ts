import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const previous = await Bun.file("evidence/wave3-findings-matrix.json").json();
const active = await Bun.file(".upstream/active.json").json();
const directory = resolve("report/evidence/wave4c-rechecks");
await mkdir(directory, { recursive: true });
const findings = previous.findings.filter((entry: any) => entry.status === "confirmed");
const results: any[] = [];
async function runFinding(finding: any) {
  const folder = finding.path.replace("/README.md", "");
  const readme = await Bun.file(finding.path).text();
  const paths = (await Array.fromAsync(new Bun.Glob(folder + "/*.test.ts").scan("."))).sort();
  const modes = ["development"];
  if (!finding.outcomes[2].startsWith("不适用")) modes.push("production");
  if (
    finding.outcomes[0].includes("observe") ||
    /versions:[\s\S]*?observe[\s\S]*?area:/.test(readme)
  )
    modes.push("observe");
  if (finding.id === "049") modes.splice(1); // This test explicitly loops all three tiers.
  for (const mode of modes)
    for (const path of paths) {
      const started = performance.now(),
        output: string[] = [];
      const command = [process.execPath, "test", "./" + path];
      const child = spawn(command[0]!, command.slice(1), {
        cwd: process.cwd(),
        env: { ...process.env, TARGET: "head", BUILD_MODE: mode },
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.stdout.on("data", (value) => output.push(String(value)));
      child.stderr.on("data", (value) => output.push(String(value)));
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          process.kill(-child.pid!, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
      }, 120000);
      const exitCode = await new Promise<number | null>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", resolve);
      }).finally(() => clearTimeout(timer));
      const log = output.join(""),
        name = finding.id + "-" + mode + "-" + path.split("/").at(-1) + ".log";
      await Bun.write(directory + "/" + name, log);
      const result = {
        id: finding.id,
        path,
        mode,
        explicitAllTiers: finding.id === "049",
        exitCode,
        timedOut,
        pass: Number(log.match(/^\s*(\d+) pass$/m)?.[1] ?? 0),
        fail: Number(log.match(/^\s*(\d+) fail$/m)?.[1] ?? 0),
        skip: Number(log.match(/^\s*(\d+) skip$/m)?.[1] ?? 0),
        ms: performance.now() - started,
        log: "report/evidence/wave4c-rechecks/" + name,
      };
      results.push(result);
      console.log(JSON.stringify(result));
      await Bun.write(
        "report/evidence/wave4c-recheck-results.json",
        JSON.stringify(
          {
            head: active.revision,
            previousHead: previous.head,
            expectedFindings: findings.length,
            completedFindings: findings.filter((f: any) => results.some((r) => r.id === f.id))
              .length,
            results,
          },
          null,
          2,
        ) + "\n",
      );
    }
}
const queue = [...findings];
await Promise.all(
  [0, 1].map(async () => {
    while (queue.length) {
      const finding = queue.shift();
      if (finding) await runFinding(finding);
    }
  }),
);
if (findings.some((finding: any) => !results.some((result) => result.id === finding.id)))
  throw new Error("Missing finding");
console.log(
  "Completed " +
    findings.length +
    " findings; assertion failures are expected and retained for review.",
);
