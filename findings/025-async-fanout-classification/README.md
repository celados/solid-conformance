---
type: Issue
id: '025'
status: confirmed
versions:
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 observe
area: diagnostics/async
upstream: []
found_by: docs-to-tests
---

# async landing 的 fan-out 诊断错误标为普通写入

预期 async memo 的 Promise 落地触发 fan-out 诊断时 `data.write` 为 `async`。实际 `HUGE_FAN_OUT` 的 `data.write` 是 `write`，同一次落地引起的 reader rerun 的 cause 却正确为 `async`。

```sh
bun test ./findings/025-async-fanout-classification/repro.test.ts
BUILD_MODE=observe bun test ./findings/025-async-fanout-classification/repro.test.ts
BUILD_MODE=production bun test ./findings/025-async-fanout-classification/repro.test.ts
```

[08-dev-diagnostics.md L419](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#huge_fan_out) 明确 `data.write: "write" | "refresh" | "async"` 标记 invalidation。程序完全没有用户 setter；来源是 `Promise.resolve(1)`。runtime 的 `asyncEnd` 在 `setSignal` 先发出的 write stamp 后重新分类，但已发出的诊断不能被改写，因此倾向 runtime 元数据错误。production 不发诊断并通过负对照。

## 缩减与去重

从默认 250 subscribers、deferred Promise、多个 kind 的 broad case 缩到可配置 `fanOut: 1`、一个 async memo 和一个 reader。删掉 reader 后没有 subscriber，也不再有 fan-out finding；移除了第二个 reader、组件、DOM、Loading、用户事件与 user setter。reader 的 final value 与 rerun cause 是正常异步落地的正对照。

分别在 solid、solid-router、solid-start 搜索 `HUGE_FAN_OUT`，不限定 state；router/start 无结果。读取 solid#3543、#3304、#3350 后排除：分别是 subscription leak、诊断建议引用缺失 API、heap walk 性能，均不涉及 async landing 的 `data.write` 分类。查询摘要在 evidence/wave3-finding025-dedupe.json。rc.13 比较由主线程统一切换依赖后执行，尚未声称其结果。
