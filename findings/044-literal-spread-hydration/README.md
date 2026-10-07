---
type: Issue
id: '044'
status: confirmed
versions:
  - "rc.13 development"
  - HEAD 53ef0e69 development
area: SSR/hydration/compiler
upstream:
  - https://github.com/solidjs/solid/issues/3313
found_by: docs-to-tests
---

# literal spread children 的 hydration id 顺序不一致

预期合法 JSX spread children 的 CSR 与 SSR→hydrate 生成相同最终 DOM、有效 handler，且没有 hydration warning。实际最小形状最终 DOM 与 click 均正常，但开发构建发出两个 tag mismatch：server 先分配 child button 的 id0，再分配 div 的 id1；client 反序期望 div0/button1。生产构建最终行为及 quiet 对照通过。

```sh
bun test ./findings/044-literal-spread-hydration/repro.test.ts
BUILD_MODE=production bun test ./findings/044-literal-spread-hydration/repro.test.ts
```

这是 CSR == SSR→hydrate 且无 mismatch/warning 的生成属性被反例推翻；类型检查接受该 JSX，无 `as any`。最小源码是一行 `<div {...{children:<button onClick={clicked}>click</button>}}/>`。倾向编译器的 SSR 参数求值或 id scope 缺陷；不能仅以生产静默当作修复。

## 缩减与去重

从含 memo/For/Errored/Portal 的 siblings 缩成一个 div 和 button，无 signal、effect、async、router 或 frames。保留 CSR 正控和真实 system Chrome hydrate，并一起记录 console 和 pageerror。复杂原始形状还出现 handler 失效，本最小 repro 仅主张可稳定证明的 tag warnings。

三仓 open/closed 查询 `spread children hydration` 只有已关闭 [#3313](https://github.com/solidjs/solid/issues/3313)，其修复避免 getter 双次求值而跳 id；当前是 literal child 只创建一次但先于 parent。故作为相关问题链接，而非相同机制的 duplicate。查询和原 issue 原文在 `evidence/wave3-finding044-*`；rc.13 由主线程统一比较。

Wave 3 独立版本对照：rc.13 development 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
