---
type: Issue
id: '060'
status: duplicate
versions:
  - solid-2.0.0-rc.15-plugin-3.0.0-next.50-vite-8.3.3
  - solid-2172a37687e92dd91758476423f08cb4a12bcb0c-plugin-ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0
area: vite/server-functions/components
upstream:
  - https://github.com/solidjs/solid-vite-plugin/issues/428
  - https://github.com/solidjs/solid-vite-plugin/pull/430
found_by: field-regression-audit
description: >
  Excluding @solidjs/web from dev dependency optimization creates distinct public client
  configuration instances; a post-boot server component receives a valid frame stream but resolves undefined.
---

# Expected and actual

The server-functions main entry and its client subpath should share the transport configuration installed by frames. With `optimizeDeps.exclude: ['@solidjs/web']`, both published RC15 and the frozen HEAD instead expose different `configureServerFunctionsClient` functions: the endpoint returns `200 application/x-frame-stream`, the call settles to `undefined`, and the requested panel never mounts.

This is a duplicate of plugin [#428](https://github.com/solidjs/solid-vite-plugin/issues/428), with an existing proposed fix in [PR #430](https://github.com/solidjs/solid-vite-plugin/pull/430). Both were open when read on 2026-10-20; PR #430 head was `7cf00dc02d6feff3395713544783db5e2866325d`. No issue or comment was created for this case.

# Run

From the repository root, the published baseline installs an isolated npm graph under this case and runs the desired-behavior assertion in system Chrome:

```sh
TARGET=rc15 bun test ./findings/060-server-functions-prebundle/repro.test.ts
```

The same test with only the child subpath added to the optimizer must pass:

```sh
TARGET=rc15 PREBUNDLE_CLIENT=1 bun test ./findings/060-server-functions-prebundle/repro.test.ts
```

The assertions never invert to accept the known defect. The unpatched test remains red, making it a removal gate for the local prebundle workaround and the eventual dependency patch.

The HEAD comparison uses frozen, pristine built runtime packages and compiles the plugin's selected source into its own isolated package. It never switches repository package links:

```sh
TARGET=rc15 PREBUNDLE_TARGET=head bun test ./findings/060-server-functions-prebundle/repro.test.ts
TARGET=rc15 PREBUNDLE_TARGET=head PREBUNDLE_CLIENT=1 bun test ./findings/060-server-functions-prebundle/repro.test.ts
```

On a fresh checkout, supply `PREBUNDLE_HEAD_PACKAGES` pointing to the pristine built Solid `2172a37687e92dd91758476423f08cb4a12bcb0c/packages`, and `PREBUNDLE_PLUGIN_SOURCE` pointing to plugin source `ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0`. They are copied/compiled only inside this case. The original local snapshot was frozen before any signals patch experiment. A missing snapshot is an explicit fixture error, never a presumed runtime failure.

The root harness's initial receipt describes its own links. The separate `receipt` printed by this test and `versions` in its evidence describe the graph actually executed by this isolated fixture.

# Evidence

| Target | Default plugin optimizer | Only include client child subpath |
| --- | --- | --- |
| RC15 + plugin next.50 | Distinct configure functions; settled `undefined`; panel count 0; desired assertion fails | Same configure function; settled function; panel count 1; assertion passes |
| Solid HEAD `2172a376` + plugin HEAD `ec6b58d0` | Same observed defect | Same positive control passes |

Every run records the HTTP status/content type, settlement value, public function identity, final DOM, page errors, requested script URLs, and the owned Vite PID in `report/evidence/field-prebundle-{rc15,head}-{unpatched,include-client}.json`. All runs close Chrome and terminate their own Vite process.

This is a **development optimizer** finding. It does not claim production failure. There is no router, authentication, database, async source, external service, or dependency patch in the fixture. The positive control adds exactly `@solidjs/web/server-functions/client` to `optimizeDeps.include`.

# Source mechanism and shrinking

Plugin source `src/index.ts:1636–1653` force-includes frames and the main server-functions entry for components, but omits the client child subpath. Frames source imports that child; excluding the parent allows a raw client module beside the optimized main entry. Frames installs its response handler on one configuration instance while compiled references use the other.

The source is only four small files: the Vite configuration, one server module, a post-boot button/Loading boundary, and a public identity probe importing the two configure functions. The identity probe distinguishes duplicated configuration from a server endpoint or frame-rendering failure without inspecting generated code. Valid HTTP frame-stream responses and explicit promise settlement keep the failure concrete; fixture boot errors are reported separately from assertion failures.

The first experimental fixture placed the directive module outside `src/`, beyond the plugin's default server-function include pattern. It executed locally and issued no RPC, so that sample was discarded. The retained fixture uses `src/` and requires one actual successful RPC in the desired assertion.

The new evidence adds an explicit public configuration-identity check, a frozen current HEAD comparison, and an unchanged red/green assertion to the existing issue shape. It is not a new upstream bug family.
