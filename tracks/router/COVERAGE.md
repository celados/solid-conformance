---
type: Reference
title: Router 2 conformance scenarios
description: Router next behavioral claims exercised through system Chrome, streaming SSR and real RPC.
resource: https://github.com/solidjs/solid-router/blob/next/README.md
---

# Cases

`bun test tracks/router` runs the selected runtime in system Google Chrome. `BUILD_MODE=production bun test tracks/router` repeats against production exports. The registry next tag was checked at the beginning of Wave 3 and resolves to `2.0.0-next.35`.

| README section | Concrete oracle |
| --- | --- |
| Preload Functions / query | A manual preload starts one keyed request; delegated anchor navigation reuses it and displays the value. |
| Dynamic Routes / useNavigate | A second navigation supersedes the pending first request; either settlement order reaches the latest route without displaying the superseded value. |
| action / useSubmissions | onSubmit runs once, optimistic state is visible while the gate is held, pending operations are absent from settled history, failure reverts the overlay, and exactly one settled record retains the error. |
| query / action | Successful mutation invalidates and refetches the active query; its new value is rendered. |
| action / Forms | A real delegated requestSubmit on a bound action sets aria-busy, commits one result, then clears aria-busy. |
| query / Redirects | A query redirect navigates softly to the target; the redirect object never appears as data. |
| liveQuery | Two consumers of the same key share one opened iterator and both receive updates; all iterators close after unmount, including the SSR first-value subscription. |
| query / Solid boundaries | A rejected route query reaches the nearest Errored and the error reporter exactly once. |
| action / Server function transport | An actual ServerFunction client proxy issues POST to the local server handler, waits for an explicit response release, decodes its result and enters router settled submission history. |
| Match Filters / Optional Parameters / Wildcard Routes / Typed Paths | One thousand generated integer paths check pure matching, rejected non-integer paths, optional parameters, nested and wildcard paths, and URL construction. |
| Typed Paths / query / action.with | Public declarations compile five documented positive examples and reject five forbidden examples using @ts-expect-error. |

The router property generator samples nine operation families, argument values and settlement direction. Every sampled case compares CSR and hydrated final HTML, with attribute order normalized, and checks console/server errors and iterator disposal. Fast-check retains shrinking and seed replay.

# Scope

The real RPC case exercises the router's normal ServerFunction action pipeline. It does not provide a flight-data collector, so it does not claim to verify the optional server integration's single-flight payload collection or the no-JavaScript flash-cookie fallback. Those are distinct integration policies. This inventory is separate from the core Solid documentation statement denominator.
