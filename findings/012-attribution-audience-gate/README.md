---
type: Issue
id: '012'
status: confirmed
versions: [HEAD-53ef0e69, 2.0.0-rc.13]
area: diagnostics
upstream: [https://github.com/solidjs/solid/issues/2883]
found_by: docs
---

# Attribution 的公开入口自动启用 folds

预期：仅导入 `attribution`、关闭 log、没有 listener 或 fold import 时，`history("rerun")` 为空。实际：开发构建的一次 memo 更新就产生一个 rerun record。

```sh
bun test ./findings/012-attribution-audience-gate/repro.test.ts
```

[RFC 08 L1121](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#api-solid-jsattribution) 承诺没有受众时不分配 record、history 为空，并称只有导入 `costs`／`feedback` 才启用 folds。开发入口的平面构建包含静态 re-export 的两个 fold 模块，而模块初始化时调用 `registerFold`；只导入 engine 也注册了它们。我们认为文档至少需要注明开发构建预付这部分成本，或调整开发入口结构。开发构建失败，分模块的 observe 构建遵循按需合同，production 的 inert engine 不受影响。

缩减：去掉所有 listener、fold 查询、DOM、interaction、async、命名和额外 memo；剩下 root、signal、一个 memo 和一次 write。用独立子进程排除其他测试已导入 fold 的污染，并显式选择公开 browser 构建。

排重：查询 Solid、Router、Start 的 open 和 closed issues，关键词 `attribution fold`、`history rerun`、`records only costs`。读过相关 [#2883](https://github.com/solidjs/solid/issues/2883) 的结构／打包审计及 [#3754](https://github.com/solidjs/solid/issues/3754) 的 interaction frame 议题；前者处理生产核心的 tree-shaking，后者处理事件归属，均不是 attribution 的无受众行为。搜索证据在 `dedupe.json`；没有向上游写入。
