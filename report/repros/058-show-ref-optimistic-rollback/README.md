# Show: ref reads a stale accessor after an optimistic hide

Requires Bun, network for the locked dependencies, and system Google Chrome. From this directory run `bun run run.ts`; the desired-behavior test is expected to fail on Solid 2.0.0-rc.21. `app.tsx` is the complete reproduction; `repro.test.ts` drives and checks it in Chrome. The runner installs in and cleans up a temporary directory.
