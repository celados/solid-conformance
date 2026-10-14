# Loading on accessor does not rearm fallback

Resolve the first request, then replace it with an unresolved request. The documented zero-argument on accessor retains 1. The otherwise identical on={id()} control displays pending.

## Run

Requires Bun and system Google Chrome. No browser download, repository-root dependency installation or framework checkout is needed. All dependencies are local and locked to published Solid 2.0.0-rc.15.

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

0 pass / 1 fail: the value-form control displays pending; the accessor-form page still displays 1. Both error channels are quiet. These are desired-behavior assertions: the failing command intentionally exits 1. Clean-install logs are retained in the filing evidence; failures are application/type expectations rather than setup errors.

## Files

`app.tsx` contains both prop forms, selected by ?control. `client.tsx` mounts the app. The test clicks Resolve first, waits for 1, clicks Replace and compares both pages. `build.ts` compiles the application. All source and test utilities are contained in this directory; none import the conformance harness. Browser/server cleanup runs in finally blocks, including after the red assertion.
