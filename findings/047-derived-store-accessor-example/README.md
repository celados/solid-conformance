---
type: Issue
id: '047'
status: confirmed
versions: [HEAD-53ef0e69-development, HEAD-53ef0e69-production, "rc.13 development", "rc.13 production"]
area: documentation/types/store
upstream: []
found_by: docs
---

# Migration 代码把 derived store 当作 accessor 调用

预期：MIGRATION.md 第 462–469 行的 derived store 使用例应可编译并产生 cache.total。实际：明确由 createStore 返回的 items 被调用为 items()，public .d.ts 报 TS2349，runtime 抛 items is not a function；改为 items.length 的正控得到 2。

```sh
bun test ./findings/047-derived-store-accessor-example/repro.test.ts
```

生产 runtime 对照：

```sh
BUILD_MODE=production bun test ./findings/047-derived-store-accessor-example/repro.test.ts
```

来源：[MIGRATION.md L462–469](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/MIGRATION.md#derived-signals-and-stores-function-forms)。我们认为文档错：其他章节正确说明 store 是可读 proxy，runtime 与类型一致。例子应读 items.length，不应要求增加 callable store。

缩减：把 api.listItems() 换成固定 [1,2]，保留两次 createStore 与 total 字段；没有 async、DOM、action、Loading 或类型断言参与红的 public-types fixture。runtime 对照只为切换同一示例的错误读取，用 cast 避免编译器先拒绝执行测试。

去重：solid、solid-router、solid-start 三仓 open/closed 搜索 derived store callable、createStore items length migration、MIGRATION derived store accessor 均无结果（dedupe.json）。它不是 018 的 nested refresh 参数类型缺失，亦不是 006 的 storePath 导出缺失。没有上游写入。

Wave 3 独立版本对照：rc.13 development、rc.13 production 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
