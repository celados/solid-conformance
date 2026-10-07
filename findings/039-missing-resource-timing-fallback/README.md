---
id: '039'
type: Finding
title: Resource-less calls lose the documented centred server span
status: confirmed
versions:
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 observe
area: diagnostics/performance
upstream: []
found_by: tracks/docs
---

RFC08 说性能轨道等待资源条目最多 30 秒，若未收到则把服务器 span 居中放到 call 中。实际原生 PerformanceObserver 存在时，该 call 在 30 秒到期后被丢弃，没有 span；不支持 observer 的同形正控会正确居中。

```sh
bun test ./findings/039-missing-resource-timing-fallback/repro.test.ts
```

来源：[08-dev-diagnostics.md L1222](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#L1222)。倾向实现少了过期回退：无法获得资源计时的缓存/自定义 transport 仍可以提供 Server-Timing，应依文档保留计时，只标明位置是近似的。production 没有性能轨道，为通过对照，非失败域。

缩减到公有 `configureServerFunctionsClient({ fetch })` 返回一个已知结果及 Server-Timing、一条 `createServerReference` 调用和性能轨道。无组件、SSR、router、reactivity 或私有 API；系统 Chrome 的原生 observer 保留，Playwright clock 只推动公有计时器/时钟过期，另发一个无关真实请求触发资源 observer 扫描。删掉等待或 observer 后不再是同一过期路径，关闭 observer 的正控排除 header 解析失败。

三仓 open/closed 搜索和相关 issue 阅读在 dedupe.json：solid#3385/#2879/#2929/#3107 与 router#649/#616 分别涉及 SSR disposal/Reveal/affects/redirect、submission commit 和重复 runtime；均非资源计时缺失时的 span 放置。未写上游。
