---
type: Issue
id: '023'
status: confirmed
versions:
  - HEAD 53ef0e69 development
area: diagnostics/documentation
upstream: []
found_by: docs-to-tests
---

# 返回 async helper 的诊断排除声明过窄

预期文档列为不覆盖的 `createMemo(() => load())` 在 `load` 内 await 后读取 signal 时不报告 `UNTRACKED_READ_AFTER_AWAIT`。实际 system Google Chrome 报告一次，与直接 native async computation 的正对照相同；production 两者均安静。

```sh
bun test ./findings/023-returned-helper-diagnostic/repro.test.ts
BUILD_MODE=production bun test ./findings/023-returned-helper-diagnostic/repro.test.ts
```

[08-dev-diagnostics.md L359](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#untracked_read_after_await) 将 `a helper returned without await (return load())` 列在不覆盖的形状中。实际警告正确指出依赖不会更新，因此倾向文档错误：排除列表应收窄，保留运行时现有诊断能力。

## 缩减与去重

移除了 DOM、组件、Loading、effect、deferred gate、写入与后续更新；剩余 root 内的一个 signal、一个 memo、返回的 async helper 和 Promise microtask。直接 async memo 是同一 signal/await 机制的正对照；不是缺失的 warning 基建导致安静。

对 solid、solid-router、solid-start 分别查询精确 code 和 `read after await`，未限定 issue state，因此同时检查 open/closed；精确 code 均无结果。阅读 solid#2987 与 #2802 后排除：前者是未初始化 async memo 的异常丢失，后者是依赖错误传播，本例读取同步 signal 且正确发出开发诊断。保存查询摘要于 evidence/wave3-finding023-dedupe.json。rc.13 比较由主线程统一切换依赖后运行，尚未声称其结果。
