# Five documentation and typing examples fail their documented expectations

Two runtime checks cover owned writes through untrack and source takeover after unpinning a writable derivation. Three typechecks cover the effect error argument, storePath import and derived-store migration accessor. Each test asserts the documented expectation, and each fails independently.

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

This installs matching Solid packages from the registry's next tag in the temporary project. It never links a checkout. The tag can still resolve to rc.15; the installation prints the resolved versions. To switch the local installation instead, run `bun run next` followed by `bun run repro`. Use development for the owned-write diagnostic; production does not promise that guard.

## Verified rc.15 result

0 pass / 5 fail: REACTIVE_WRITE_IN_OWNED_SCOPE; pinned n remains 99 rather than 3; TS2559, TS2305 and TS2349. All corrected controls pass. These are desired-behavior assertions: the failing command intentionally exits 1. Clean-install logs are retained in the filing evidence; failures are application/type expectations rather than setup errors.

## Files

`untrack.ts` and `pinned.ts` use the client-development runtime, bundled by `build.ts`; no DOM is needed. `fixtures/` contains the three literal type examples and corrected controls. `repro.test.ts` runs all five checks. Corrected controls pass before each red expectation. All source and test utilities are contained in this directory; none import the conformance harness. Browser/server cleanup runs in finally blocks, including after the red assertion.
