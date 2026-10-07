---
type: Issue
id: '053'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production]
area: documentation/action/optimistic/store
upstream: []
found_by: docs
---

# Live-send 示例 await 后需要先恢复 action 上下文

预期：RFC 06 C166 的 async generator 在 await fire-and-forget send 后直接 yield until，收到权威 live echo 即完成。实际：乐观数组有相同 clientId 的真实 source 更新后，until 仍等到 100ms timeout；只在 await 后增加一个 bare yield 的对照正常完成且不会被自己的 optimistic row 提前确认。

```sh
bun test ./findings/053-await-send-until-context/repro.test.ts
```

生产对照：

```sh
BUILD_MODE=production bun test ./findings/053-await-send-until-context/repro.test.ts
```

来源：[06-actions-optimistic.md L161–169](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md#live-sources-acknowledge-through-the-source-until)。这是 HEAD-only 行为回归：rc.13 development/production 的同一程序均通过。更倾向文档示例应补 bare yield：该章较早的 async-generator 示例已说明 bare yield 用来重新进入 transition context，live-send 示例却在 native await 后先构造依赖数组 row 属性的 until。裸 yield 对照只证明这一规避形状；不能据此宣称 HEAD 的新行为是有意设计。应由上游判断是否恢复 rc.13 的行为，或把上下文要求明确写进该例。我们没有把 runtime 回归的可能性排除。

缩减：将 socket.send 的 fire-and-forget 返回值缩为 await 0，将 transport 缩为一个权威 signal 数组。保留 optimistic store、单个 clientId 属性、some 属性读取、async generator 和 until；去掉 DOM、Loading、router、UUID、text、server function、网络及 async iterable。去掉对象属性读取改为 number[] includes 或改为 optimistic boolean signal 后失败消失，因此它们不能替代必要的 store row 读取。

去重：三仓 open/closed 搜索 async generator until after await、until optimistic array await、action await send until 与更宽的 until async。#3687 是 attribution 开启时 overlay 不回滚，本例没有 attribution、没有失败的服务调用；023 是 after-await diagnostic 排除列表，本例不依赖任何诊断。没有上游写入。
