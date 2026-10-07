import { build, type BuildMode } from "../../scripts/build";
export async function buildFrames(
  outdir: string,
  variant: BuildMode = (process.env.BUILD_MODE as BuildMode) ?? "development",
  entries = { client: "tracks/frames/client.tsx", server: "tracks/frames/server.tsx" },
) {
  return build(outdir, variant, { client: [entries.client], server: [entries.server] });
}
