# Nested derived-store refresh is rejected by public types

The documented refresh(store.row) call fails TypeScript because the nested node has no refresh brand. A root refresh(store) control compiles. The repro asserts that the documented nested call should compile; it does not invoke the code at runtime.

## Run

Requires Bun; no browser is required. No browser download, repository-root dependency installation or framework checkout is needed. All dependencies are local and locked to published Solid 2.0.0-rc.15.

After cloning at the issue's pinned commit, from this directory:

```sh
bun install
bun run repro
```

Alternatively, one command creates a clean temporary project, installs the lockfile, runs the same test and removes the project:

```sh
bun run run.ts rc15
```

## Compare with next

```sh
bun run run.ts next
```

This installs matching Solid packages from the registry's next tag in the temporary project. It never links a checkout. The tag can still resolve to rc.15; the installation prints the resolved versions. To switch the local installation instead, run `bun run next` followed by `bun run repro`. Default build is development. Browser examples also accept BUILD_MODE=production before the run command.

## Verified rc.15 result

0 pass / 1 fail: TS2345 reports the missing [$REFRESH] brand for store.row. The root-store control exits 0. These are desired-behavior assertions: the failing command intentionally exits 1. Clean-install logs are retained in the filing evidence; failures are application/type expectations rather than setup errors.

## Files

`usage.ts` is the complete three-line application example. `repro.test.ts` invokes the locally installed TypeScript compiler for the root control and then the nested node, without casts or suppression comments. All source and test utilities are contained in this directory; none import the conformance harness. Browser/server cleanup runs in finally blocks, including after the red assertion.
