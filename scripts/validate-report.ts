import { resolve, dirname } from "node:path";

const target = await Bun.file("report/evidence/target.json").json();
const previous = await Bun.file("evidence/wave3-findings-matrix.json").json();
const active = new Set<string>(
  previous.findings
    .filter((entry: any) => entry.status === "confirmed")
    .map((entry: any) => entry.id),
);
const seen = new Set<string>();
const issues = (await Array.fromAsync(new Bun.Glob("report/issues/*.md").scan("."))).sort();
const visibleCounts: Record<string, number> = {};
for (const path of issues) {
  const text = await Bun.file(path).text();
  const front = Bun.YAML.parse(text.split("---")[1]!) as any;
  if (front.type !== "Issue" || front.status !== "draft")
    throw new Error("Wrong draft metadata: " + path);
  if ((front.head ?? front.target) !== target.revision) throw new Error("Stale target: " + path);
  for (const id of front.findings) {
    if (!active.has(id) || seen.has(id)) throw new Error("Duplicate or inactive case: " + id);
    seen.add(id);
  }
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, "");
  const visible = body.split("<details>")[0]!;
  visibleCounts[path] = visible.trim().split("\n").length;
  if (visibleCounts[path]! > 60) throw new Error("First view exceeds 60 lines: " + path);
  if (!body.includes("<details>") || !body.trimEnd().endsWith("</details>"))
    throw new Error("Automated reproduction must be last: " + path);
  if (front.tier === "A") {
    const name = path.split("/").at(-1)!.replace(".md", "");
    const snippet = visible.match(/```(?:ts|tsx)\n([\s\S]*?)\n```/)?.[1];
    if (!front.snippet || !snippet) throw new Error("Missing readable source: " + path);
    const source = await Bun.file("report/repros/" + name + "/" + front.snippet).text();
    if (source.trim() !== snippet.trim()) throw new Error("Displayed source mismatch: " + path);
  }
  for (const [, raw] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (raw!.startsWith("http") || raw!.startsWith("#")) continue;
    const file = raw!.split("#")[0]!.split(":")[0]!;
    if (raw!.endsWith("/")) continue;
    if (!(await Bun.file(resolve(dirname(path), file)).exists()))
      throw new Error("Broken local link: " + path + ":" + raw);
  }
}
if (seen.size !== active.size) throw new Error("Missing confirmed case");
for (const path of ["report/README.md", "report/TRIAGE.md"]) {
  const text = await Bun.file(path).text();
  for (const [, raw] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (raw!.startsWith("http") || raw!.startsWith("#") || raw!.endsWith("/")) continue;
    if (!(await Bun.file(resolve(dirname(path), raw!)).exists()))
      throw new Error("Broken index link: " + path + ":" + raw);
  }
}
console.log(
  JSON.stringify({
    head: target.revision,
    proposals: issues.length,
    coveredFindings: seen.size,
    duplicateCoverage: 0,
    visibleCounts,
    valid: true,
  }),
);
