---
type: Issue
id: '013'
status: confirmed
versions: [HEAD-53ef0e69]
area: documentation/reactivity
upstream: ['https://github.com/solidjs/solid/issues/3612']
found_by: docs
---

# pinned writable signal 的文档示例清标记后无法重新跟随 source

预期：RFC 02 说清掉 pinned 标记会让下一次 source change 接管，且两次写在同一个 update 中也适用。实际：照文档函数形状创建的 signal，在 pinned 分支执行后退订 source，随后清标记和改变 source 得到旧值 99，而不是 source 新值 3。

```sh
bun test ./findings/013-pinned-source-retake/repro.test.ts
```

来源：[02-signals-derived-ownership.md 第 130–132 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md#function-form-createsignal-writable-memo)。我们认为文档示例错：条件分支的依赖会被移除，应该在选择 pinned 结果之前始终读取 source。对应始终读取 source 的 derived store 控制例通过。

缩减：无需 DOM、Loading、action、Promise、effect 或订阅器；只保留两个信号与两组同步写，第一组让 pinned 分支退订 source，第二组按文档同时清除标记和改变 source。

去重：检查三个仓库 open 与 closed 的 pinned、derived signal dependency、writable memo 结果。相关 #3612 是异步 hold 期间外部 imperative write 覆盖 held derivation，已在 #3630 修复；本例无 hold、无 async，是条件依赖退订后文档示例丢失重新计算触发，与该根因不同。没有上游写入。
