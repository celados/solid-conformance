---
type: Issue
id: '010'
status: confirmed
versions: [HEAD-53ef0e69]
area: diagnostics
upstream: []
found_by: docs
---

# onSettled 内普通 createSignal 没有文档承诺的诊断

预期：RFC 08 明确把 `createSignal` 列在 `onSettled` 中不能创建的 primitive 内，并承诺 `PRIMITIVE_IN_FORBIDDEN_SCOPE`。实际：HEAD 开发构建中的 `createSignal(0)` 正常返回，结构化诊断通道为空。

```sh
bun test ./findings/010-leaf-signal-diagnostic/repro.test.ts
```

来源：[08-dev-diagnostics.md 第 189–201 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#primitive_in_forbidden_scope)。01 也说这些 leaf primitives 不能创建 nested primitives。实现中的 `setupComputedNode` 检查 leaf owner，而普通 signal 不创建 computation：`createSignal(() => 0)` 与 `createMemo` 会触发检查，`createSignal(0)` 不会。我们倾向认为文档需要把禁令限于拥有计算生命周期的 primitive；不把这个字面差异当成已证明的资源泄漏。

缩减：只保留 root、onSettled、一个 plain signal 和捕获诊断的等待；没有 DOM、effect、异步 source 或写操作。复现显式打包 browser development exports，避免 Bun 默认使用 production signals 造成假阴性。production 不承诺此诊断，所以不做 production 红断言。

去重：对 solidjs/solid、solidjs/solid-router、solidjs/solid-start 的 open 和 closed issues 搜索 `PRIMITIVE_IN_FORBIDDEN_SCOPE` 与 `onSettled createSignal`，均无结果；没有向上游写入。
