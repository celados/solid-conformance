---
type: Issue
id: '029'
status: fixed-upstream
versions:
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 production
area: async/Loading
upstream:
  - https://github.com/solidjs/solid/issues/2706
  - https://github.com/solidjs/solid/issues/2829
  - https://github.com/solidjs/solid/issues/3524
found_by: docs-to-tests
---

# latest 驱动的 Loading 在共享源落地后仍保留 fallback

预期共享的 async memo 落地为 2 后两个 Loading 的最终 DOM 为 `22`。实际 `on={latest(id)}` 的边界永远保留 `A`，另一边界正确变为 2；直接 `on={id()}` 的对照收敛为 `22`。

```sh
bun test ./findings/029-latest-loading-convergence/repro.test.ts
BUILD_MODE=production bun test ./findings/029-latest-loading-convergence/repro.test.ts
```

这是 async 全部 settle 后的最终 DOM 收敛与包装不变性错误。没有 zero-arity function `on`，因此不是 finding 007 的函数身份问题。真实 system Chrome 中等待 30×20ms 后仍为 `A2`；async memo 的实际值为 2，初始 DOM `11` 和等待期 `A1` 均通过。

## 缩减与去重

从三种 display-ahead 模式缩到一个 signal、一个 memo、两个受控 Promise 和两个 Loading，无 action、optimistic、diagnostics listener 或 SSR。第二个共享读取的 `<b>` 是必要形状：改成裸 hole 后通过。删掉额外 Loading 则不能复现共享位置问题。

三仓 open/closed 搜索 `Loading latest` 并读取 solid#2706、#2829、#3524、#3764。2706 是同一边界混合 latest/read 时缺失值、2829 是首次 latest 与 isPending、3524 是 signal 与 memo 的 fallback 未启动、3764 是 SSR live 订阅；这里 fallback 已启动但共享源落地后不退出，保留相关链接而未判定重复。记录在 evidence/wave3-finding029-dedupe.json。

Wave 4a 独立 rc.13 补验：development 1 pass / 0 fail；production 1 pass / 0 fail。原始日志在 report/evidence/029-rc13-*-supplement.log；报告版本陈述以此为准。

## Wave 5 re-baseline

Published comparator: Solid `2.0.0-rc.15`, Router `2.0.0-next.39`. Development: passes (a zero-test tier is not applicable); production: passes (a zero-test tier is not applicable). Raw results: [rc.15 matrix](../../report/evidence/wave5-rc15-matrix.json). HEAD at `e3716454129f8438b65257c95db5c383622494ba` is independently re-run in the [HEAD matrix](../../report/evidence/wave5-head-matrix.json); use its individual rows rather than assuming every red assertion is a runtime defect.

The original desired-behavior test passes in rc.15. Fix: [20db6a2](https://github.com/solidjs/solid/commit/20db6a26aeb59a97e4968b6d1422e794b159f31a), included in the rc.15 release. Original failing versions remain above as historical provenance.

## Wave 5 filing bar

**excluded-fixed**: Desired-behavior repro passes in the latest tested runtime; historical failing versions retained.
