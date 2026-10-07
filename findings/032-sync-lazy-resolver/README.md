---
type: Issue
id: '032'
status: confirmed
versions:
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 production
area: SSR/lazy
upstream: []
found_by: docs-to-tests
---

# 同步 asset resolver 异常终止 SSR

预期 lazy 的资产解析失败只影响 preload，组件的服务端 HTML 仍然输出。实际 resolver 同步抛错会使整个 renderToStream 失败；相同 resolver 返回 rejected Promise 时页面正确渲染。

```sh
bun test ./findings/032-sync-lazy-resolver/repro.test.ts
BUILD_MODE=production bun test ./findings/032-sync-lazy-resolver/repro.test.ts
```

[08-dev-diagnostics.md L674](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#lazy_asset_unmapped) 明确资产 resolver 抛错会报告 `resolution-failed`，且页面仍渲染。同步和异步两条 resolver 路径应一致；资产提示应不阻断内容，因此倾向 runtime 错误。最小程序没有 Loading、组件 props、DOM、hydration 或用户事件，保留 Promise.reject 作为成功对照。删除 lazy 的 module URL 或 resolver 后不再触发这个异常分支。

## 去重

三仓 solid、solid-router、solid-start 搜索 `lazy asset resolver` 与 `LAZY_ASSET_UNMAPPED`，不限制 issue state，均无结果；现有 ledger 无同类。查询结果与 dev/prod 红日志在 evidence/wave3-finding032-*。

Wave 4a 独立 rc.13 补验：development 0 pass / 1 fail；production 0 pass / 1 fail。原始日志在 report/evidence/032-rc13-*-supplement.log；报告版本陈述以此为准。
