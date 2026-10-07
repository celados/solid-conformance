已完成并推送至 `origin/main`：`9bd02c9`。没有上游写入。

- **next SHA：** `3086f1b77cd7b0431d3a7f768c2984c335758633`
- **状态变化：** 无；47 个 confirmed 仍复现，没有新增 fixed-upstream。
- **验证：** 原始案例 99 次调用；15 个独立目录均验证了 rc.13 和 next 单命令入口。186 个固定链接全部通过 `gh api`。
- [完整回执](https://github.com/celados/solid-conformance/blob/9bd02c9dbcec3d4cf1780b689ce320e4507efb6d/report/evidence/wave4c-receipt.md) · [最终 filing 清单及草稿](https://github.com/celados/solid-conformance/blob/9bd02c9dbcec3d4cf1780b689ce320e4507efb6d/report/FILING.md)

最终标题按 filing 顺序如下：

1. [2.0 next, regressed after rc.13] Replacement derived-store rejection never reaches Errored
2. [2.0 next, regressed after rc.13] Production refresh remains pending after a settled computation (production build)
3. [2.0 rc.13 + next] Second mount of a shared server-component factory fails hydration
4. [2.0 rc.13 + next] Open decoded iterators are missed when a response dies
5. [2.0 next, regressed after rc.13] Production tree shaking removes store affects registration (production build)
6. [2.0 next, regressed after rc.13] Loading on latest remains in fallback after a shared source settles
7. [2.0 rc.13 + next] Aborted document closes a live-hole channel twice
8. [2.0 rc.13 + next] Nested server region stays stale after refetch then argument change
9. [2.0 next, regressed after rc.13] Awaited refresh returns the caller optimistic override
10. [2.0 rc.13 + next] Synchronous lazy asset resolver failure aborts SSR
11. [2.0 rc.13 + next] 304 format header overwrites cached GET representation
12. [2.0 next, regressed after rc.13] Async-generator action times out on its authoritative live echo
13. [2.0 rc.13 + next] Cookie parser loses the valid __proto__ cookie name
14. [2.0 rc.13 + next] Unrenderable object beside text throws instead of being skipped
15. [2.0 rc.13 + next] Literal spread children allocate hydration IDs in a different order
16. [2.0 rc.13 + next] Solid 2 documentation errata — 01-reactivity-batching-effects.md
17. [2.0 rc.13 + next] Solid 2 documentation errata — 02-signals-derived-ownership.md
18. [2.0 rc.13 + next] Solid 2 documentation errata — 03-control-flow.md
19. [2.0 rc.13 + next] Solid 2 documentation errata — 04-stores.md
20. [2.0 rc.13 + next] Solid 2 documentation errata — 05-async-data.md
21. [2.0 rc.13 + next] Solid 2 documentation errata — 06-actions-optimistic.md
22. [2.0 rc.13 + next] Solid 2 documentation errata — 08-dev-diagnostics.md
23. [2.0 rc.13 + next] Solid 2 documentation errata — 10-server-functions.md
24. [2.0 rc.13 + next] Solid 2 documentation errata — 11-server-components.md
25. [2.0 rc.13 + next] Solid 2 documentation errata — 12-ssr-http.md
26. [2.0 rc.13 + next] Solid 2 documentation errata — MIGRATION.md
27. [2.0 rc.13 + next] Solid 2 diagnostics and observability contract discrepancies