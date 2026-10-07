---
type: Issue
id: '019'
status: confirmed
versions: [HEAD-53ef0e69, 2.0.0-rc.13]
area: diagnostics/action
upstream: [https://github.com/solidjs/solid/issues/3754]
found_by: docs
---

# action 在 await 后的写入标记为 external

预期：action body 在 await 后的写入 origin 是 `async`。实际：一次 signal 写入的 rerun cause 是 `external`。

```sh
bun test ./findings/019-action-await-origin/repro.test.ts
```

[RFC 08 L1154](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md) 写道：“Writes made after an `await` inside an action's body have left the action's synchronous frame; they are stamped `async`”。测试显式选公开 development 构建；dev 和 observe 都输出 `external`，production 的 inert engine 不适用。

我们认为文档更可能错误：同步 action frame 已退出，而普通 await continuation 没有可归属的 async source node；当前实现把它视为未绑定的外部写入，和其他 handler 的 await escape 一致。`tracks/docs/attribution-isolation.test.ts` 的正控验证 await 前写入为 action、promise source 的 landing 为 async。

缩减：去掉 await 前写入、名称、DOM、listener、interaction、effect、store 和所有复杂 timing；仅保留一个 signal、一个依赖 memo、一次 async generator action 中的 await 后写入。去掉 await 后写入不会有 rerun，去掉 memo 无可检查记录，去掉 await 会得到 action origin。

排重：三仓 open/closed 搜索 `attribution action async origin`、`"external" attribution` 并检查 Solid `attribution` 所有命中。读 #3754（事件分发的多个 listener frame），其问题是一个 DOM event 被分成多次 interaction，与 action 的 await continuation 不同；没有发现同一声明差异。查询记录见 `dedupe.json`，未向上游写入。
