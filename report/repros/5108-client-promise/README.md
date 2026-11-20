---
title: Client promise reduction for solidjs/solid issue 5108
type: Reproduction
---

From this directory run `bun install --frozen-lockfile && bunx playwright install --no-shell chromium && bun run repro`. The fixture derives from the inline app in [#5108](https://github.com/solidjs/solid/issues/5108). The browser-only read is a plain promise rendered as a number. The server-adopted reads retain the original live-source implementation. On 2.0.3 the server text stays at no5 throughout the two-second observation window.
