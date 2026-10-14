---
type: Reference
title: Discrepancy ledger — Wave 5
description: rc.15、Solid/Router HEAD 的原始红测试、修复和 filing bar。
---

# Ledger

本轮 Solid HEAD `e3716454129f8438b65257c95db5c383622494ba`，Router HEAD `4a1685ec8f1ab045843b2ae590c7afe821f73d90`。原 52 项均复跑；12 个旧 confirmed 转为 fixed-upstream，另保留 001–003 的历史修复。新增 055 confirmed、056 duplicate（#3851 的编译 JSX 形状）。新增 057 为 rendering-order confirmed。共 55 项：15 fixed-upstream、37 confirmed、3 duplicate。编号 037、043 仍为撤回保留号。

原始矩阵：[rc.15](report/evidence/wave5-rc15-matrix.json)、[HEAD](report/evidence/wave5-head-matrix.json)、[observe](report/evidence/wave5-observe-matrix.json)、[新案例](report/evidence/wave5-new-matrix.json)。红色包括文档/type/诊断合同断言，不一概等于可报告的 app runtime defect；逐项 [filing bar](report/TRIAGE.md)，批次 [FILING](report/FILING.md)。四个自行关闭 issue 仍只记录结果，未重新拟稿。

| ID | 状态 | 一行说明 | rc.15 dev | rc.15 production | HEAD dev | HEAD production |
| --- | --- | --- | --- | --- | --- | --- |
| [001](findings/001-streamed-store-keyed/README.md) | fixed-upstream | Streamed createStore with a keyed For | 绿 | 绿 | 绿 | 绿（单独补跑；首轮超时） |
| [002](findings/002-iterable-discovery/README.md) | fixed-upstream | Child with a setup async read | 绿 | 绿 | 绿 | 绿 |
| [003](findings/003-tsrx-asi/README.md) | fixed-upstream | Native TSRX scalar setup declaration before markup | 绿 | 绿 | 绿 | 绿 |
| [004](findings/004-derived-store-rejection/README.md) | fixed-upstream | Derived store drops a replacement request's rejection | 绿 | 绿 | 绿 | 绿 |
| [005](findings/005-keyed-reconcile-identity/README.md) | duplicate | Reconcile identity wording omits the subscription boundary | 红 | 红 | 红 | 红 |
| [006](findings/006-storepath-export/README.md) | confirmed | Documented storePath helper is absent from browser solid-js | 红 | 红 | 红 | 红 |
| [007](findings/007-loading-on-accessor/README.md) | confirmed | Loading's documented zero-argument on accessor never rearms | 红 | 红 | 红 | 红 |
| [008](findings/008-production-refresh/README.md) | fixed-upstream | Production refresh returns a promise that never settles | 绿 | 绿 | 绿 | 绿 |
| [009](findings/009-frame-nested-region-stale/README.md) | fixed-upstream | Nested server regions stay stale after a same-arguments refetch | 绿 | 绿 | 绿 | 绿 |
| [010](findings/010-leaf-signal-diagnostic/README.md) | confirmed | onSettled 内普通 createSignal 没有文档承诺的诊断 | 红 | 红 | 红 | 红 |
| [011](findings/011-frame-multisite-hydration/README.md) | fixed-upstream | 共享服务端组件引用的第二个挂载无法水合 | 绿 | 绿 | 绿 | 绿 |
| [012](findings/012-attribution-audience-gate/README.md) | confirmed | Attribution 的公开入口自动启用 folds | 红 | 绿 | 红 | 绿 |
| [013](findings/013-pinned-source-retake/README.md) | confirmed | pinned writable signal 的文档示例清标记后无法重新跟随 source | 红 | 红 | 红 | 红 |
| [014](findings/014-live-drop-completes/README.md) | fixed-upstream | A connected live source completes after a dropped TCP connection | 绿 | 绿 | 绿 | 绿 |
| [015](findings/015-untrack-owned-write/README.md) | confirmed | untrack 不能按文档所说放行 owned-scope 写入 | 红 | 绿 | 红 | 绿 |
| [016](findings/016-production-store-affects/README.md) | fixed-upstream | production 的 store affects 注册在 tree shaking 中丢失 | 绿 | 绿 | 绿 | 绿 |
| [017](findings/017-initial-render-error-record/README.md) | confirmed | Initial render failure is absent from the structured diagnostics channel | 红 | 不适用／skip | 红 | 不适用／skip |
| [018](findings/018-nested-refresh-types/README.md) | confirmed | 文档允许 refresh nested store，但公共类型拒绝 | 红 | 红 | 红 | 红 |
| [019](findings/019-action-await-origin/README.md) | confirmed | action 在 await 后的写入标记为 external | 红 | 红 | 红 | 红 |
| [020](findings/020-observe-frame-corruption/README.md) | confirmed | Observe frames do not report a missing slot end marker | dev 绿；observe 红 | 不适用／skip | dev 绿；observe 红 | 不适用／skip |
| [021](findings/021-recovery-boundary-outcome/README.md) | confirmed | Recovery documentation names the wrong server boundary outcome | 红 | 不适用／skip | 红 | 不适用／skip |
| [022](findings/022-refresh-optimistic-authority/README.md) | fixed-upstream | action 中 refresh 返回自身 optimistic guess | 绿 | 绿 | 绿 | 绿 |
| [023](findings/023-returned-helper-diagnostic/README.md) | confirmed | 返回 async helper 的诊断排除声明过窄 | 红 | 绿 | 红 | 绿 |
| [024](findings/024-single-typed-array-encoding/README.md) | confirmed | A lone typed array does not require the documented rich-arguments opt-in | 红 | 红 | 红 | 红 |
| [025](findings/025-async-fanout-classification/README.md) | confirmed | async landing 的 fan-out 诊断错误标为普通写入 | 红 | 绿 | 红 | 绿 |
| [026](findings/026-cookie-proto-key/README.md) | confirmed | Cookie parser 丢失合法的 __proto__ 名称 | 红 | 红 | 红 | 红 |
| [027](findings/027-server-write-all-builds/README.md) | confirmed | Server-write warnings are development-only despite the all-builds claim | 绿 | 红 | 绿 | 红 |
| [028](findings/028-artifact-format-version/README.md) | confirmed | artifact 格式版本说明落后 | 红 | 绿 | 红 | 绿 |
| [029](findings/029-latest-loading-convergence/README.md) | fixed-upstream | latest 驱动的 Loading 在共享源落地后仍保留 fallback | 绿 | 绿 | 绿 | 绿 |
| [030](findings/030-effect-error-signature/README.md) | confirmed | 文档把 effect error handler 写成第三个参数 | 红 | 红 | 红 | 红 |
| [031](findings/031-direct-error-hook-tier/README.md) | confirmed | Direct invocation error hook tier | 红 | 红 | 红 | 红 |
| [032](findings/032-sync-lazy-resolver/README.md) | confirmed | 同步 asset resolver 异常终止 SSR | 红 | 红 | 红 | 红 |
| [033](findings/033-symbol-insert-diagnostic/README.md) | confirmed | Symbol 的服务端 insert 缺少 documented warning | 红 | 绿 | 红 | 绿 |
| [034](findings/034-mixed-insert-object/README.md) | confirmed | 相邻文本使不可渲染 object 从 skip 变为 DOM 异常 | 红 | 红 | 红 | 红 |
| [035](findings/035-decoder-iterator-body-death/README.md) | fixed-upstream | Dying response leaves an iterator pull pending | 绿 | 绿 | 绿 | 绿 |
| [036](findings/036-conditional-cache-format/README.md) | fixed-upstream | Conditional GET replaces cached data's format with Void | 绿 | 绿 | 绿 | 绿 |
| [038](findings/038-frame-call-state-doc-reset/README.md) | confirmed | Per-call reset text contradicts consumption-site mount identity | 红 | 红 | 红 | 红 |
| [039](findings/039-missing-resource-timing-fallback/README.md) | confirmed | 039-missing-resource-timing-fallback | 红 | 绿 | 红 | 绿 |
| [040](findings/040-initial-binding-console/README.md) | confirmed | 040-initial-binding-console | 红 | 红 | 红 | 红 |
| [041](findings/041-dynamic-source-tracking/README.md) | confirmed | Async dynamic 的 source callback 仍执行一次 hydration tracking | 红 | 红 | 红 | 红 |
| [042](findings/042-malformed-preload-crossorigin/README.md) | confirmed | 非字符串 preload crossorigin 没有诊断 | 红 | 绿 | 红 | 绿 |
| [044](findings/044-literal-spread-hydration/README.md) | confirmed | literal spread children 的 hydration id 顺序不一致 | 红 | 绿 | 红 | 绿 |
| [045](findings/045-server-optimistic-write-wording/README.md) | confirmed | SERVER_WRITE 段落将 optimistic no-op 写成落地数据 | 红 | 红 | 红 | 红 |
| [046](findings/046-held-derived-store-seed/README.md) | confirmed | Held derived store 的外部 draft 写入读取 pending seed | 红 | 红 | 红 | 红 |
| [047](findings/047-derived-store-accessor-example/README.md) | confirmed | Migration 代码把 derived store 当作 accessor 调用 | 红 | 红 | 红 | 红 |
| [048](findings/048-first-loading-held-signal/README.md) | confirmed | 首次 Loading 读取 held plain signal 时显示旧值 | 红 | 红 | 红 | 红 |
| [049](findings/049-document-live-channel-abort/README.md) | fixed-upstream | Aborted document closes its live-hole channel twice | 绿 | 绿 | 绿 | 绿 |
| [050](findings/050-literal-handler-attribution/README.md) | duplicate | 编译出的字面量原生 handler 没有 interaction 归因 | 红 | 红 | 红 | 红 |
| [051](findings/051-unnamed-attribution-owner-id/README.md) | confirmed | 未命名节点的诊断名称不回退到 owner id | 红 | 红 | 红 | 红 |
| [052](findings/052-transparent-ssr-slot/README.md) | confirmed | transparent 在 SSR 也会跳过 hydration 源记录与 slot | 红 | 红 | 红 | 红 |
| [053](findings/053-await-send-until-context/README.md) | fixed-upstream | Live-send 示例 await 后需要先恢复 action 上下文 | 绿 | 绿 | 绿 | 绿 |
| [054](findings/054-prearrived-recovery-wait/README.md) | confirmed | 已到达的服务端拒绝仍计入恢复等待时间 | 红 | 不适用／skip | 红 | 不适用／skip |
| [055](findings/055-held-navigation-feedback/README.md) | confirmed | Held navigation loses delayed feedback | 红 | 红 | 红 | 红 |
| [056](findings/056-latest-mounted-boundary/README.md) | duplicate | Compiled latest-mounted Loading tears beside committed state | 红 | 红 | 红 | 红 |
| [057](findings/057-loading-lazy-hydration-order/README.md) | confirmed | Hydration reverses static/lazy children after a sibling | 红 | 红 | 红 | 红 |

默认宽测试的已知签名识别不改写 findings 的 desired-behavior 断言；fixed-upstream 的原红例如今自然通过。observe/dev-only/type 的生产零测试不是修复证据。文档库存仍引用历史固定 source SHA；本轮 filing 引用 HEAD 文档。没有上游写入，提交不 push。
