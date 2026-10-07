---
type: Issue
id: '016'
status: confirmed
versions: [HEAD-53ef0e69-production]
area: optimistic/action/packaging
upstream: ['https://github.com/solidjs/solid/issues/2887']
found_by: docs
---

# production 的 store affects 注册在 tree shaking 中丢失

预期：action 中调用 affects(store, key) 可以声明该 store slot 将变为 pending，不应抛错。实际：正常 Bun production bundle 调用就拒绝，错误是 GlobalQueue.O is not a function；开发 bundle 通过。

```sh
BUILD_MODE=production bun test ./findings/016-production-store-affects/repro.test.ts
```

来源：[06-actions-optimistic.md affects](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/06-actions-optimistic.md#affects-declare-that-in-flight-work-will-change-the-data)。这是运行时/发布包的问题：production 模块 `store/affects.js` 负责向 GlobalQueue 安装 storeMarks，而 package.json 声明 sideEffects:false；该注册被 tree shaking 移除。关闭 tree shaking 并忽略 DCE annotations 的同一程序通过，原测试保持默认 tree shaking，未修改 Solid。

```sh
BUILD_MODE=production NO_TREE_SHAKE=1 bun test ./findings/016-production-store-affects/repro.test.ts
```

缩减：没有 DOM、Loading、isPending、effect、异步源、gate、optimistic write；只保留 root、createStore、action 和 affects(store, 'n')。

去重：搜索 solid、solid-router、solid-start 的 open 与 closed issues 的 affects production、affects store、storeMarks，相关 #2887 是 beta.18 的 first-statement mark witnessing/生命周期故障，已在 #2888 修复；它需要 live For 与后续 optimistic write，且没有生产 bundle 抛错。本例无需任何 reader，根因是注册模块被摇掉。没有上游写入。

Wave 4a 独立 rc.13 补验：development 1 pass / 0 fail；production 1 pass / 0 fail。原始日志在 report/evidence/016-rc13-*-supplement.log；报告版本陈述以此为准。
