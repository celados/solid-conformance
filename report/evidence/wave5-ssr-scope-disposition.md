---
type: Review
title: Hand-written SSR hole disposition
status: not-a-bug
---

# SSR scope disposition

The Delta report's fresh-promise non-convergence uses a hand-written `ssr()` hole without compiler scope pinning. The work order identifies it as internal misuse under solidjs/solid#3734. The [upstream response](https://github.com/solidjs/solid/issues/3734#issuecomment-6003670573) distinguishes the fixed async-iterable cache failure from unsupported hand-written template holes. It is excluded from findings and filing: no compiled application shape producing that non-convergence was established.

A compiled application control was exercised while shrinking 057: a component creates a Promise-returning memo for C under Loading beside A/B. It converges to A/B/C in CSR and hydration with quiet channels. Its local log is retained as [the compiled Promise control](wave5-compiled-promise-control.log). That control does not exhaust every possible Promise placement, but it gives no basis to turn the internal hole into an app runtime finding.

057 is independent: it uses a normal lazy module import and completes, but hydration changes the final child order. It does not depend on a hand-written SSR hole or non-convergence.
