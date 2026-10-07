---
type: Issue
id: '022'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production]
area: optimistic/action/async
upstream: []
found_by: docs
---

# action 中 refresh 返回自身 optimistic guess

预期：RFC 06 明确保证 refresh 返回已经落地的权威值，绝不能返回 caller 自己的 optimistic override。实际：source 只返回 2 的 optimistic memo 在 action 内被写成 99 后，yield refresh(read) 返回 99；开发与生产构建都失败。

```sh
bun test ./findings/022-refresh-optimistic-authority/repro.test.ts
```

来源：[06-actions-optimistic.md 第 98 行及第 186 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md#awaitable-refresh)。我们认为 runtime 错：该 accessor 是公开的 refreshable function-form primitive，refresh 的读取保留 own transition view，因而读到了 overlay。结果会让“refetch 已确认”的程序根据自己尚未确认的 guess 继续执行。

缩减：没有 DOM、Loading、effect、until、gate、store 或其他 async source；只保留一个固定返回 Promise.resolve(2) 的 createOptimistic、一次 write(99)、yield refresh(read)。首次 resolve 只使程序在合法 settled 初态开始，root/dispose 只负责生命周期清理。去掉 optimistic write 后应返回 2。

去重：在 solid、solid-router、solid-start 的 open 与 closed issues 搜索 refresh optimistic override、refresh authority、refresh staged，无结果。没有上游写入。

Wave 4a 独立 rc.13 补验：development 1 pass / 0 fail；production 1 pass / 0 fail。原始日志在 report/evidence/022-rc13-*-supplement.log；报告版本陈述以此为准。
