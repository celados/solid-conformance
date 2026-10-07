---
type: Issue
id: '018'
status: confirmed
versions: [HEAD-53ef0e69-types]
area: types/async
upstream: []
found_by: docs
---

# 文档允许 refresh nested store，但公共类型拒绝

预期：RFC 06 写明 nested store node 可以 refresh，整个 derive family 会重新询问，并向 caller 返回该 nested node。实际：公共 .d.ts 把 refresh 入参限制为带 [$REFRESH] brand 的 Refreshable；derived store 的 root 有该 brand，其 row 属性没有，合法文档用法编译失败。

```sh
bun test ./findings/018-nested-refresh-types/repro.test.ts
```

来源：[06-actions-optimistic.md 第 95 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md#awaitable-refresh) 与 [05-async-data.md 第 346 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md#refetching)。运行时正例 `06/refresh-nested-node` 在 dev 与 production 均通过：row identity 相同、row 和 sibling 的值同时更新。因此我们认为 public types 错，应表达 nested store 的 refreshable 能力，而不是收窄已实现的行为。

缩减：只保留 import、一个带 nested record 的 function-form createStore，以及 refresh(store.row) 三行。类型 fixture 不执行任何程序，不加载 DOM，不需要 DOM library；不修改依赖声明、不使用 any。runtime 正控只用 @ts-expect-error 注明已知声明缺陷，独立复现依然要求合法 usage 编译成功，保持红。

去重：在三个仓库的 open 与 closed issues 搜索 refresh nested types、Refreshable nested、refresh TypeScript，无结果。没有上游写入。
