# Wave 3 — complete the docs inventory and widen the surface

Wave 2 verified independently on HEAD 53ef0e69: 004, 006, 007 and 008 each fail with their
one command. Good work; 004 (HEAD-only) and 008 (production-only) are exactly what we want.

## 0. Housekeeping
- `node_modules/solid-js` on main is a symlink into the `solid-conformance-wave2` worktree.
  Make the HEAD build live inside this checkout (`.upstream/`, git-ignored) so main does not
  depend on another worktree, then remove the finished worktrees (wave1, wave2).
- Refresh the HEAD snapshot first; re-check every confirmed finding on the new HEAD and
  mark any that now pass as `fixed-upstream`.

## 1. Docs inventory to completion
Enumerate every behavioral statement in all of `documentation/solid-2.0/` (count first,
so the receipt can say covered/total), then cover the remaining ones. Untestable ones are
listed with a reason.

## 2. New surfaces (your wave-2 recommendations plus these)
- diagnostics and dev-mode warnings (do the documented warnings fire, and only then);
- types: the public `.d.ts` against documented signatures (a type test that the documented
  usage compiles, and that misuse the docs forbid does not);
- server components / server functions where the docs describe them;
- @solidjs/router 2 (`next`): navigation, preload, query/liveQuery, actions and submissions,
  redirects, and their interaction with Loading/Errored across SSR and hydration;
- a real transport lifecycle for live sources (a small local WebSocket or SSE server the
  test controls: drop, reconnect, slow first message) instead of simulated source swaps.

## 3. Generated properties
Raise case counts where runs are cheap; add the router operations from §2 to the
transition generator.

## Rules and receipt
AGENTS.md as before. Receipt: HEAD commit, statements covered/total, cases per track,
findings table (id, status, one line, HEAD / rc.13 / production), and wave 4 suggestions.
