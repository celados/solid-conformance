---
type: Issue
id: '059'
status: duplicate
versions:
  - Solid 2.0.0-rc.15 / vite-plugin 3.0.0-next.50 / Vite 8.3.4 production
  - Solid HEAD 2172a37687e92dd91758476423f08cb4a12bcb0c / same plugin and Vite production
area: toolchain/server-components/CSS/production
upstream: [https://github.com/solidjs/solid-vite-plugin/issues/456]
found_by: Delta field history / server-component CSS dependency patch
---

# Server-component CSS is absent from production document and frame navigation

Expected: a server component importing a plain stylesheet is red on its production SSR document and after client navigation. Actual: its HTML mounts once on both paths, but both compute black; adding the stylesheet to the client entry turns both red. This is a duplicate of existing [plugin #456](https://github.com/solidjs/solid-vite-plugin/issues/456), with an executable conformance case and an isolated current-HEAD comparison.

## Run

From the conformance root:

```sh
bun run --cwd findings/059-server-component-css test
```

The command installs this finding's own pinned browser harness and creates separate RC15 and HEAD fixture dependency trees under this finding's ignored `.scratch/`. It does not relink, install into, or modify the conformance root's runtime packages. Both tests deliberately fail at the final desired-color assertion until the upstream issue is fixed.

The HEAD comparison requires a built `2172a37687e92dd91758476423f08cb4a12bcb0c` in the repository's standard `.upstream/<sha>/packages` location, or the private snapshot already created under this finding's `.scratch/upstream/<sha>/packages`. The runner copies that build once, excluding its `node_modules`; it never writes to the source build. The six packages are solid-js, signals, web, compiler, babel-plugin and diagnostics. In particular, it retains the locally built `compiler.node`, which the published compiler's files allowlist does not include.

Each fixture first resolves an exact registry dependency graph, then the HEAD fixture replaces the physical package directories inside its own node_modules with the private builds. It removes each directory before copying to avoid writing through package-cache hardlinks. This keeps transitive imports on one runtime/compiler graph rather than mixing source-linked and registry instances. The installed package versions and real paths are recorded in each receipt.

## Evidence and controls

- [RC15 receipt](../../report/evidence/field-css-rc15.json)
- [Current HEAD receipt](../../report/evidence/field-css-head.json)
- Solid RC15 SHA: `4937f0a2bfddd45a65738c189075aff577530073`.
- Solid HEAD SHA: `2172a37687e92dd91758476423f08cb4a12bcb0c`.
- Vite plugin: published `3.0.0-next.50`; its current source HEAD is `ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0`, unchanged from the source tested in #456. Vite `8.3.4`, Bun `1.4.2`, playwright-core `1.64.1`, system Google Chrome `155.0.8059.85`.

Both versions independently build with plain Vite and run `vite preview`; there is no Cloudflare, Vite+, router, CSS filter, dependency exclusion or custom manifest. Each baseline and client-import control uses fresh browser contexts. Before the final expected-red assertion, the test checks that raw SSR HTML contains the notes, both browser paths contain exactly one notes element, document adoption sends no server-function request, navigation receives HTTP 200 `application/x-frame-stream`, and all page/console/server error channels are empty. It then checks that the client-import control is red on both paths. The baseline's frame body and stylesheet links remain in the receipts.

The final assertion preserves the desired behavior: `["rgb(255, 0, 0)", "rgb(255, 0, 0)"]`. It currently receives `["rgb(0, 0, 0)", "rgb(0, 0, 0)"]` for both versions. Browser and preview processes are closed in `finally`, their exact server PIDs and exit state are recorded, and each run directory is removed. The reusable private HEAD snapshot and local browser-harness installation stay ignored.

## Shrinking and disposition

The app contains one button, one conditional branch, one Loading, one dynamic server component, and one plain CSS rule imported only by the server component. The server function has no arguments, captured state, async source, slots, API calls or external backend. Client navigation is a local signal update so it isolates frame delivery from routing. Moving the CSS import to the client entry is the only positive-control change.

This case covers plain `.css`, production SSR, production frame navigation and the client-owned import control. CSS Modules and a development-server control are not exercised here; #456 already records those variants. It is not a new finding and should not create a second upstream issue. No upstream write is performed by this test.

The source boundary is documented in #456: the compiler removes server implementation imports from the client transform, the plugin's production manifest consumes the client graph, while development collects CSS through the SSR graph. Source references are [compiler transform](https://github.com/solidjs/solid/blob/2aa9e86ada5beb33211f60260c59234bbcf14899/packages/compiler/src/directives/transform.rs#L570-L573), [plugin server-functions transform](https://github.com/solidjs/solid-vite-plugin/blob/ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0/src/server-functions/index.ts#L708-L742) and [frame styles transport](https://github.com/solidjs/solid/blob/2aa9e86ada5beb33211f60260c59234bbcf14899/packages/web/frames/src/frame-sink.ts#L565-L577). Built artifacts are executed, not used as explanatory source evidence.
