# rc.21 control-flow probe

Run from the repository root with Bun and system Google Chrome:

```sh
bun run report/probes/rc21-control-flow/run.ts player
bun run report/probes/rc21-control-flow/run.ts matrix
```

Both install the exact locked packages in an isolated temporary directory. The player probe passed 64 cases. The matrix probe ran 1,152 cases and fails on the known ref shapes in findings 058/059; it is an exploration, not a green regression suite. The matrix asserts no captured browser errors and no rendered error fallback, not every intermediate DOM frame or full convergence. `after-settle` in this exploratory matrix is an extra initial delay, not settlement of a pending transition; the player probe separately tests writes both while and after a pending async memo/action settles.

The matrix crosses Show, Match, positional For, and Repeat; plain attribute, spread, render effect, memo, children(), and ref; plain writes, action writes, optimistic writes, and a sibling async memo; nested and single branches; and Loading, Errored, or no boundary. Repeat receives a number, not an accessor. These are bounded scenarios, not an exhaustive proof of absence. The nested branch is removed simultaneously in the nested variants. All effect/ref reads occur as part of creating or updating the branch, and the page is reloaded between cases.

The player probe recreates the two conditions with one state object and compares plain img attributes with a preceding JSX spread, nested and single Show, time-only vs time-plus-waiting changes, plain or action writes, and writes during or after an independent pending action or async memo. It asserts the final img is removed and records browser errors. No transition API named startTransition exists in rc.21; pending work is represented with action and async memo instead.
