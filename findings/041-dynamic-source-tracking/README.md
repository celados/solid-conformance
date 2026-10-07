---
type: Issue
id: '041'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production, "rc.13 development", "rc.13 production"]
area: documentation/hydration
upstream: []
found_by: docs
---

# Async dynamic 的 source callback 仍执行一次 hydration tracking

预期：RFC 03 对 source 明确写着“the source is not re-run”；已采用服务器异步结果的客户端不再调用该 source callback。实际：仅返回 Promise.resolve('article') 的 source 在 hydration 被调用一次；采用 DOM 和最终 tag 正确，console 无错误。

```sh
bun test ./findings/041-dynamic-source-tracking/repro.test.ts
```

生产对照：

```sh
BUILD_MODE=production bun test ./findings/041-dynamic-source-tracking/repro.test.ts
```

来源：[03-control-flow.md 第 202 行](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/03-control-flow.md#async-sources-data-and-server-references-not-client-component-loaders)。该段把传给 dynamic 的函数称为 source，紧邻说明 source 可以返回 promise；第 205 行还明确允许 native tag。因此这个例子属于承诺的 domain，既不是客户端 component loader，也没有任何网络调用可与 callback 混淆。

我们认为文档错。RFC 05 已说明 hydration 会进行 memo dependency tracking run，runtime 的一次调用与此一致；RFC 03 应区分「采用服务器值、避免真实 source request」与「完全不执行 source callback」。这是文档字面合同差异，不宣称重复网络请求或 hydration mismatch。

缩减：去掉 argument、setters、另一个 sibling、props/ref、stream controls、deferStream、server function、fetch 和 async iterable，仅一个 promise tag source、计数器和必要的 Loading。CSR 调用一次为计数正控；hydrate 断言零次保持红。

去重：三仓 open/closed 搜索 dynamic hydration source rerun、dynamic hydration tracking、dynamic callback server 均无结果。#3734 的 streaming holes 与 #3338 的 lazy hydration 都需要本例已去掉的机制；本例仅 callback invocation 的文档声明。没有上游写入。

Wave 3 独立版本对照：rc.13 development、rc.13 production 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
