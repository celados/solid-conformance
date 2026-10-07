---
type: Issue
id: '050'
status: duplicate
versions:
  - rc.13 development
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 observe
area: diagnostics/attribution
upstream:
  - https://github.com/solidjs/solid/issues/3754
found_by: docs
---

# 编译出的字面量原生 handler 没有 interaction 归因

RFC 08 C1081 承诺 “Compiled event bindings do this for every handler”。实际编译生成的 literal `onMouseEnter` 使用裸 `addEventListener`，其信号写入 origin 是 `external`；同页面非 literal accessor handler 是 `interaction`。

运行：

```sh
bun test ./findings/050-literal-handler-attribution/repro.test.ts
```

倾向文档错误：08 L1175 已明确记录 literal handler 的限制，所以 C1081 的全称注释应限定为 runtime 包装的事件绑定。该红例是 open #3754 所述运行时之外裸监听器机制的编译器生成 sibling，不作为未知 runtime 新缺陷；三仓 open/closed 检索原始结果位于 `evidence/dedupe.json`。#3754 的完整正文保留于 `evidence/issue3754.json`；router#643 是相同限制在文档级路由监听器上的实例，#3389 是性能对比而非本合同。

收缩至一个信号、一个订阅读取和两个按钮：literal 按钮保留红 oracle，accessor 按钮是同事件类型的正控。移除网络、actions、Loading、路由、异步 settle；生产构建没有 attribution 记录，不属于此 dev/observe 合同。

rc.13 的独立 dev 对照同签名失败，原始日志见 evidence/wave3-finding050-rc13.log。production 不保留这个观测 API，记为不适用。
