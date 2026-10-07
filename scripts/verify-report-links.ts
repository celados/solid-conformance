import { mkdir } from "node:fs/promises";

const urls = new Set<string>();
for (const path of await Array.fromAsync(new Bun.Glob("report/issues/*.md").scan("."))) {
  const text = await Bun.file(path).text();
  for (const match of text.matchAll(
    /https:\/\/github\.com\/celados\/solid-conformance\/(?:tree|blob)\/[a-f0-9]{40}\/[^\s)]+/g,
  ))
    urls.add(match[0]);
}
const queue = [...urls].sort();
const results: { url: string; api: string; exitCode: number; error?: string }[] = [];
await Promise.all(
  [0, 1, 2, 3].map(async () => {
    while (queue.length) {
      const url = queue.shift()!;
      const match = new URL(url).pathname.match(
        /^\/celados\/solid-conformance\/(?:tree|blob)\/([a-f0-9]{40})\/(.+)/,
      )!;
      const api =
        "repos/celados/solid-conformance/contents/" +
        match[2]!.replace(/\/$/, "") +
        "?ref=" +
        match[1];
      const child = Bun.spawn(["gh", "api", api, "--silent"], { stdout: "pipe", stderr: "pipe" });
      const [error, exitCode] = await Promise.all([
        new Response(child.stderr).text(),
        child.exited,
      ]);
      results.push({ url, api, exitCode, ...(exitCode ? { error } : {}) });
    }
  }),
);
await mkdir("report/evidence", { recursive: true });
await Bun.write(
  "report/evidence/wave4c-pinned-links.json",
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      method: "gh api contents for every unique public reproduction/file path at the pinned commit",
      results: results.sort((a, b) => a.url.localeCompare(b.url)),
    },
    null,
    2,
  ) + "\n",
);
if (results.some((result) => result.exitCode))
  throw new Error("Pinned links did not resolve; inspect report/evidence/wave4c-pinned-links.json");
console.log("Verified " + results.length + " pinned paths via gh api.");
