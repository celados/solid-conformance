---
type: Issue
id: '052'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production]
area: documentation/SSR/hydration
upstream: [https://github.com/solidjs/solid/issues/3012, https://github.com/solidjs/solid/issues/3609]
found_by: docs
---

# transparent 在 SSR 也会跳过 hydration 源记录与 slot

预期：RFC 05 L227 明确说 SSR ignores the option，并称 server-side nodes always allocate their id slot；transparent true 与 false 的 SSR 源记录应相同。实际：同一个返回 Promise.resolve(42) 的 memo，false 产生源记录 0=42；true 不产生该记录，Loading 与 span 的公开 hydration key 也少一个 slot。

```sh
bun test ./findings/052-transparent-ssr-slot/repro.test.ts
```

生产对照：

```sh
BUILD_MODE=production bun test ./findings/052-transparent-ssr-slot/repro.test.ts
```

来源：[05-async-data.md L227](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md#transparent-client-only-computations-no-hydration-id)。我们认为文档错：runtime 在两个端都跳过同一个 transparent source，可保持 namespace 一致。SSR 忽略此选项的说法已经过时；本例不要求 runtime 恢复忽略选项，也不宣称有 hydration mismatch。

缩减：一个 async memo、一个 Loading、一个 span，SSR only，不需要 Chrome、setter、第二个源、async iterable、router、action 或外部 transport。读取的是输出 HTML 的公开 _hk 和执行公开 records script 得到的 hydration registry，不读取私有 owner/node 字段。false 正控确证记录存在且值为 42，true 比较保留红。

去重：三仓 open/closed 搜索 transparent SSR hydration slot、transparent server serialization、transparent createMemo SSR；另宽搜 transparent 并核对 #3012 和 #3609。#3012 记录的是 rc.0 真实 hydration namespace 偏移与失活的 runtime 错误；#3609 是 null owner 时异常。本例无需 hydration，报告当前 HEAD 文档仍声称忽略 SSR 选项，属于新文档复现形状。搜索证据在 dedupe.json。没有上游写入。
