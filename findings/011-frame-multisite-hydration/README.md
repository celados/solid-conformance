---
type: Issue
id: '011'
status: confirmed
versions:
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 production
area: frames/hydration
upstream: []
found_by: router/frame docs-to-tests
---

# 共享服务端组件引用的第二个挂载无法水合

预期同一个服务端组件 factory 在两个消费位置分别保留可工作的客户端 slot。CSR 有两个独立按钮；SSR→hydrate 后只剩一个按钮，较大的路由复现保留两套外层 HTML，但第二个按钮没有 handler，第二套服务端 anchor 也没有 router active state。

```sh
bun test ./findings/011-frame-multisite-hydration/repro.test.ts
BUILD_MODE=production bun test ./findings/011-frame-multisite-hydration/repro.test.ts
```

[11-server-components.md L67](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/11-server-components.md#the-wire) 声明 multi-instance mounting 将同一个流分发给每个挂载；L149 的 identity split 又明确 mount 属于 consumption site。这里共享的是 factory reference，不是复用已经创建的 JSX/DOM。运行时应保证每个消费位置独立水合，因此倾向 runtime 错误。

## 缩减与去重

移除了 router、query、preload、导航、actions、参数变化、外层 article、slot args 与显式 `$key`。剩余一个 Promise memo、一个 dynamic factory、两个调用点和一个共享 Counter。删掉任何一个调用点即恢复单挂载；同一测试先跑 CSR 作为可重复 factory 的正对照。

在 solid、solid-router、solid-start 搜索时没有限定 state，因此同时检查了 open/closed。读了 solid#3849、#3813 的 consistency 索引和 solid#2973：#2973 是 args-bearing address 与 wire-id 前缀不一致；本例没有参数仍失败。#3813/C18 的延迟 record 分类与本例已完整到达的两个挂载不同。完整查询摘要在 evidence/wave3-finding011-dedupe.json。

Wave 4a 独立 rc.13 补验：development 0 pass / 1 fail；production 0 pass / 1 fail。原始日志在 report/evidence/011-rc13-*-supplement.log；报告版本陈述以此为准。
