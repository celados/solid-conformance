---
type: Issue
id: '015'
status: confirmed
versions: [HEAD-53ef0e69-development]
area: documentation/reactivity
upstream: []
found_by: docs
---

# untrack 不能按文档所说放行 owned-scope 写入

预期：RFC 01 建议把写入移到 event handlers、onSettled 或 untracked blocks。实际：在 root 中用 untrack 包住 setter，开发构建仍抛 REACTIVE_WRITE_IN_OWNED_SCOPE；production 没有这个诊断，因此该版本的复现通过。

```sh
bun test ./findings/015-untrack-owned-write/repro.test.ts
```

来源：[01-reactivity-batching-effects.md 第 20 行与第 274 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/01-reactivity-batching-effects.md#no-writes-under-owned-scope)。我们认为文档错：untrack 去掉 tracking listener，不去掉 owner；正确建议是写在 imperative scope、onSettled callback，或确实需要时使用 ownedWrite。正常 imperative setter 和 onSettled 控制例通过。

缩减：一个 root、一个 signal 和 untrack 内的一个 setter。没有 effect、异步资源、Loading、DOM、SSR 或其他写入；保留 dispose 只用于测试资源清理。

去重：在三个仓库的 open 与 closed issues 搜索 untrack ownedWrite 与 untrack owned scope，无结果。未向上游写入。
