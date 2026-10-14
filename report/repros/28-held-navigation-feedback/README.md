# Held navigation loses delayed pending feedback

A persistent Router shell starts a 300 ms feedback timer while navigating to unresolved lazy route children. The old page and URL remain visible. The test expects a role=status indicator after 400 ms; it is absent. Releasing the route promise commits the new page normally.

## Run

Requires Bun and system Google Chrome. No browser download, repository-root dependency installation or framework checkout is needed. All dependencies are local and locked to published Solid 2.0.0-rc.15 and Router 2.0.0-next.39.

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

This installs matching Solid packages from the registry's next tag in the temporary project. It never links a checkout. The tag can still resolve to rc.15; the installation prints the resolved versions. To switch the local installation instead, run `bun run next` followed by `bun run repro`. Router remains pinned to next.39 to keep the comparison on the same router. Default build is development. Browser examples also accept BUILD_MODE=production before the run command.

## Verified rc.15 result

0 pass / 1 fail: expected status 1, received status 0; old text and / remain. Release commits new text and /slow. These are desired-behavior assertions: the failing command intentionally exits 1. Clean-install logs are retained in the filing evidence; failures are application/type expectations rather than setup errors.

## Files

`client.tsx` contains the complete Router, Feedback and two routes. `repro.test.ts` checks the held page/URL and the missing indicator, then releases navigation and verifies convergence. `build.ts` selects the supported Router solid export and compiles its JSX with the matching Solid compiler. All source and test utilities are contained in this directory; none import the conformance harness. Browser/server cleanup runs in finally blocks, including after the red assertion.
