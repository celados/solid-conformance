---
type: Issue
id: '048'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production, "rc.13 development", "rc.13 production"]
area: documentation/Loading/action
upstream: []
found_by: docs
---

# 首次 Loading 读取 held plain signal 时显示旧值

预期：RFC 05 L50 明确包括「a write inside an action」；独立挂载的首次 Loading 读取仍被 action 持有的 value，应立即显示 fallback。实际：value 从 0 写入 1 后 action 仍停在手动 gate，新 Loading 渲染 0 且 isPending(value) 为 true，未显示 fallback；action 完成后显示 1。

```sh
bun test ./findings/048-first-loading-held-signal/repro.test.ts
```

生产对照：

```sh
BUILD_MODE=production bun test ./findings/048-first-loading-held-signal/repro.test.ts
```

来源：[05-async-data.md L50](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/05-async-data.md#loading-is-the-new-suspense)。我们认为文档的 domain 过宽：plain signal 已有可读的 committed 值，不抛 NotReadyError；首次读取未就绪 async source 的对照确实显示 fallback。文档应限定不能提供 committed answer 的读取，而非把所有 held write 都包含在 fallback 保证中。

缩减：一个 held signal write、一个手动 promise gate、一个外部 Show 挂载事件和一个 Loading。未就绪 async source 正控证明 Loading 能进入 fallback；由同一 held write 挂载 Show 的正控证明其直到 commit 都不显示 fallback。没有 SSR、router、live source、optimistic、refresh 或依赖用户计时顺序的网络。

去重：三仓 open/closed 搜索 Loading first mount held signal、Loading action stale new boundary、Loading first read transaction hold 均无结果（dedupe.json）。029 是已显示内容后的 latest(on) 重入不收敛；本例首次独立挂载、没有 on/latest，并会在 action 完成后收敛。没有上游写入。

Wave 3 独立版本对照：rc.13 development、rc.13 production 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
