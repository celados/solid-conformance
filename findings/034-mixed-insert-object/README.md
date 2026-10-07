---
type: Issue
id: '034'
status: confirmed
versions:
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 production
area: DOM/insert
upstream: []
found_by: docs-to-tests
---

# 相邻文本使不可渲染 object 从 skip 变为 DOM 异常

预期 insert 中的 plain object 被跳过，已有文本 `valid` 正常显示。实际 `<div>valid{object}</div>` 使 Chrome 的 `insertBefore` 抛出非 Node 的 TypeError；只有 object 的 single-hole 对照正确跳过。

```sh
bun test ./findings/034-mixed-insert-object/repro.test.ts
BUILD_MODE=production bun test ./findings/034-mixed-insert-object/repro.test.ts
```

[08-dev-diagnostics.md L692](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#unrecognized_insert_value) 声明 renderer 无法处理的 plain object 会被 skip。production 没有 warning 但应保持 skip 行为；mixed child 的数组 normalize 路径把 plain object 当 Node 留下，实际 DOM 插入崩溃。因此倾向 runtime 渲染路径不一致的错误。

## 缩减与去重

只保留一个 `<div>`、一个相邻文本节点与一个 plain object，没有 state、effects、async、router、SSR 或 hydration。删掉文本后通过，single-hole 正对照保留。三仓 open/closed 搜索 `insertBefore object` 无结果；读取 solid#3734，其为 SSR async owner id 导致 discovery 不收敛，与本例的同步 DOM 数组归一化路径不同。查询与红日志在 evidence/wave3-finding034-*。rc.13 比较由主线程统一执行。
