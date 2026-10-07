---
type: Issue
id: '046'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production, "rc.13 development", "rc.13 production"]
area: documentation/store/action
upstream: [https://github.com/solidjs/solid/issues/3612]
found_by: docs
---

# Held derived store 的外部 draft 写入读取 pending seed

预期：按照 RFC 02 的「a hold changes when the result is shown, not what it is」和 derived store 的相同保证，添加 hold 不改变本例最终值 103。实际：无 hold 的 derived store 和 held derived signal 都得到 103，held derived store 的外部 draft 写入读取 pending 值 3，最终得到 105。

```sh
bun test ./findings/046-held-derived-store-seed/repro.test.ts
```

生产对照：

```sh
BUILD_MODE=production bun test ./findings/046-held-derived-store-seed/repro.test.ts
```

来源：[02-signals-derived-ownership.md L134–136](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/02-signals-derived-ownership.md#local-writes-that-survive-source-updates)。我们认为文档过宽：store draft 写入的 pending backing 读取规则可能是有意的；文档却把 store 与 signal 的 hold 合同等同。这个反例只断言持有前后结果差异，不要求所有 draft 读取改成 committed，也不宣称其他 async 行为有错。

缩减：只有一个 source signal、一个 derived store、一个 action 和一个手动 gate；去掉 DOM、Loading、async memo、刷新和乐观覆盖层。signal 与无 hold store 为必要对照；只有 held store 断言保持红。

去重：三仓 open/closed 搜索 derived store held draft、createStore action derived prev、held derivation external write，结果保存于 dedupe.json。相关 #3612 的例子是直接 setter 用旧帧值覆盖新派生值；本例是 draft setter 从 pending backing 起算，之后再派生一次。它增加了不同复现形状与不同的文档结果承诺。没有上游写入。

Wave 3 独立版本对照：rc.13 development、rc.13 production 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
