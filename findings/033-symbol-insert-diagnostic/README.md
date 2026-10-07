---
type: Issue
id: '033'
status: confirmed
versions:
  - HEAD 53ef0e69 development
area: diagnostics/SSR
upstream: []
found_by: docs-to-tests
---

# Symbol 的服务端 insert 缺少 documented warning

预期 plain object 和 Symbol 在 insert 位置都会被跳过并发出 `UNRECOGNIZED_INSERT_VALUE`。实际 SSR 的 object 正确发出一条，Symbol 被跳过但没有 warning；production 两者都安静的负对照通过。

```sh
bun test ./findings/033-symbol-insert-diagnostic/repro.test.ts
BUILD_MODE=production bun test ./findings/033-symbol-insert-diagnostic/repro.test.ts
```

[08-dev-diagnostics.md L692](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#unrecognized_insert_value) 明确 server/client 的 insert warning 包括 plain object 与 Symbol。真实 Chrome 的单 hole 客户端两种值都发出 warning（tracks/docs/server-diagnostic-cases.tsx 的 unrecognized-value），server 的 `tryResolveString` 对 symbol 则直接返回空串。倾向遗漏诊断的 runtime 问题。

## 缩减与去重

一个 `<div>` 的单 child hole，无其他文本、components、state、effects、async 或 hydration。object 是同路径正对照。三仓 open/closed 搜索 `symbol insert` 均无结果，现有 ledger 没有该诊断分支。查询与日志在 evidence/wave3-finding033-*；rc.13 比较由主线程统一执行。
