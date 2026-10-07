---
id: '040'
type: Finding
title: Initial binding diagnostic has no DOM console argument
status: confirmed
versions:
  - "rc.13 development"
  - HEAD 53ef0e69 development
area: diagnostics
upstream: []
found_by: tracks/docs
---

首次执行 JSX 属性绑定时，诊断应按 RFC08 的承诺，把它写入的 DOM 元素放在第二个 console 参数。实际初次 compute 发出的 WIDE_SCOPE_DEPS 只有消息；同一形状在首屏写入完成后才扩大依赖，则正确带元素。

```sh
bun test ./findings/040-initial-binding-console/repro.test.ts
```

来源：[08-dev-diagnostics.md L17–18](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#L17)。现实现是在 DOM callback 写入时才标记绑定，初次 compute 的告警早于该标记。倾向文档承诺过强：应说明首次 compute 尚无元素；若坚持原合同，则需提前提供绑定位置。此用例固定 development 构建，生产/observe console guidance 不适用。

缩减到一个 `title` 绑定、两个信号和公有 `wideDeps: 2` 配置。延后依赖增加的正控保留，以排除 console 截取错误；删除任一依赖便达不到阈值。无 async、store、router、hydration 或框架私有字段。

三仓 open/closed 搜索保存在 dedupe.json。另读 solid#3739（HMR 依赖被计入的阈值问题）与 #3351（projection 叶信号保留），机制不同；未发现首次绑定 console DOM 参数的问题。未写上游。

Wave 3 独立版本对照：rc.13 development 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
