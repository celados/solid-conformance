---
type: Reference
title: Discrepancy ledger
description: 每项最小红测试、HEAD／rc.13／production 对照和上游去重。
---

# Ledger

本轮 Solid HEAD：`53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`。上游操作全部只读。各 finding README 记录预期／实际、单命令、应修改文档还是运行时的判断、缩减过程及相关 issue；JSON 去重证据搜索 open 和 closed issues，涵盖 solid、solid-router、solid-start。搜索结果不是不存在重复 issue 的绝对证明。

HEAD 列以 development 为准并额外标出 observe；最后一列独立列出 HEAD production。不适用表示该合同属于 dev 检查、观察 artifact 或类型 API，没有声称生产也有该功能。

| ID | 状态 | 一行说明 | HEAD | rc.13 | HEAD production |
| --- | --- | --- | --- | --- | --- |
| [001](findings/001-streamed-store-keyed/README.md) | fixed-upstream | Streamed createStore with a keyed For | 绿 | 红 | 绿 |
| [002](findings/002-iterable-discovery/README.md) | fixed-upstream | Child with a setup async read | 绿 | 红 | 绿 |
| [003](findings/003-tsrx-asi/README.md) | fixed-upstream | Native TSRX scalar setup declaration before markup | 绿 | 红 | 绿 |
| [004](findings/004-derived-store-rejection/README.md) | confirmed | Derived store drops a replacement request's rejection | 红 | 绿（开发／生产） | 红 |
| [005](findings/005-keyed-reconcile-identity/README.md) | duplicate | Reconcile identity wording omits the subscription boundary | 红 | 红 | 红 |
| [006](findings/006-storepath-export/README.md) | confirmed | Documented storePath helper is absent from browser solid-js | 红 | 红 | 红 |
| [007](findings/007-loading-on-accessor/README.md) | confirmed | Loading's documented zero-argument on accessor never rearms | 红 | 红 | 红 |
| [008](findings/008-production-refresh/README.md) | confirmed | Production refresh returns a promise that never settles | 绿 | 绿（开发／生产） | 红 |
| [009](findings/009-frame-nested-region-stale/README.md) | confirmed | Nested server regions stay stale after a same-arguments refetch | 红 | 红 | 红 |
| [010](findings/010-leaf-signal-diagnostic/README.md) | confirmed | onSettled 内普通 createSignal 没有文档承诺的诊断 | 红 | 红 | 不适用：dev 检查 |
| [011](findings/011-frame-multisite-hydration/README.md) | confirmed | 共享服务端组件引用的第二个挂载无法水合 | 红 | 红 | 红 |
| [012](findings/012-attribution-audience-gate/README.md) | confirmed | Attribution 的公开入口自动启用 folds | 红；observe 正控绿 | 红 | 不适用：生产无观测 |
| [013](findings/013-pinned-source-retake/README.md) | confirmed | pinned writable signal 的文档示例清标记后无法重新跟随 source | 红 | 红 | 红 |
| [014](findings/014-live-drop-completes/README.md) | confirmed | A connected live source completes after a dropped TCP connection | 红 | 红 | 红 |
| [015](findings/015-untrack-owned-write/README.md) | confirmed | untrack 不能按文档所说放行 owned-scope 写入 | 红 | 红；生产绿 | 绿 |
| [016](findings/016-production-store-affects/README.md) | confirmed | production 的 store affects 注册在 tree shaking 中丢失 | 绿 | 绿（开发／生产） | 红 |
| [017](findings/017-initial-render-error-record/README.md) | confirmed | Initial render failure is absent from the structured diagnostics channel | 红（observe 也红） | 正控缺 hook；非同缺陷 | 不适用：观测记录 |
| [018](findings/018-nested-refresh-types/README.md) | confirmed | 文档允许 refresh nested store，但公共类型拒绝 | 类型红 | 类型红 | 不适用：类型 |
| [019](findings/019-action-await-origin/README.md) | confirmed | action 在 await 后的写入标记为 external | 红（observe 也红） | 红 | 不适用：dev 归因 |
| [020](findings/020-observe-frame-corruption/README.md) | confirmed | Observe frames do not report a missing slot end marker | dev 绿／observe 红 | dev 绿／observe 红 | 不适用：观测检查 |
| [021](findings/021-recovery-boundary-outcome/README.md) | confirmed | Recovery documentation names the wrong server boundary outcome | 红（observe 也红） | 红 | 不适用：观测记录 |
| [022](findings/022-refresh-optimistic-authority/README.md) | confirmed | action 中 refresh 返回自身 optimistic guess | 红 | 绿（开发／生产） | 红 |
| [023](findings/023-returned-helper-diagnostic/README.md) | confirmed | 返回 async helper 的诊断排除声明过窄 | 红 | 红 | 绿 |
| [024](findings/024-single-typed-array-encoding/README.md) | confirmed | A lone typed array does not require the documented rich-arguments opt-in | 红 | 红 | 红 |
| [025](findings/025-async-fanout-classification/README.md) | confirmed | async landing 的 fan-out 诊断错误标为普通写入 | 红（observe 也红） | 红 | 绿 |
| [026](findings/026-cookie-proto-key/README.md) | confirmed | Cookie parser 丢失合法的 __proto__ 名称 | 红 | 红 | 红 |
| [027](findings/027-server-write-all-builds/README.md) | confirmed | Server-write warnings are development-only despite the all-builds claim | dev 绿 | dev 绿／生产红 | 红 |
| [028](findings/028-artifact-format-version/README.md) | confirmed | artifact 格式版本说明落后 | 红（observe 也红） | 红 | 不适用：artifact |
| [029](findings/029-latest-loading-convergence/README.md) | confirmed | latest 驱动的 Loading 在共享源落地后仍保留 fallback | 红 | 绿（开发／生产） | 红 |
| [030](findings/030-effect-error-signature/README.md) | confirmed | 文档把 effect error handler 写成第三个参数 | 类型红 | 类型红 | 不适用：类型 |
| [031](findings/031-direct-error-hook-tier/README.md) | confirmed | Direct invocation error hook tier | 红 | 红 | 红 |
| [032](findings/032-sync-lazy-resolver/README.md) | confirmed | 同步 asset resolver 异常终止 SSR | 红 | 红 | 红 |
| [033](findings/033-symbol-insert-diagnostic/README.md) | confirmed | Symbol 的服务端 insert 缺少 documented warning | 红 | 红 | 绿 |
| [034](findings/034-mixed-insert-object/README.md) | confirmed | 相邻文本使不可渲染 object 从 skip 变为 DOM 异常 | 红 | 红（开发／生产） | 红 |
| [035](findings/035-decoder-iterator-body-death/README.md) | confirmed | Dying response leaves an iterator pull pending | 红（observe 也红） | 红（开发／生产） | 红 |
| [036](findings/036-conditional-cache-format/README.md) | confirmed | Conditional GET replaces cached data's format with Void | 红（observe 也红） | 红（开发／生产） | 红 |
| [038](findings/038-frame-call-state-doc-reset/README.md) | confirmed | Per-call reset text contradicts consumption-site mount identity | 红 | 红（开发／生产） | 红 |
| [039](findings/039-missing-resource-timing-fallback/README.md) | confirmed | 039-missing-resource-timing-fallback | 红（observe 也红） | dev 红／生产绿 | 绿 |
| [040](findings/040-initial-binding-console/README.md) | confirmed | 040-initial-binding-console | 红 | 红 | 不适用：dev console |
| [041](findings/041-dynamic-source-tracking/README.md) | confirmed | Async dynamic 的 source callback 仍执行一次 hydration tracking | 红 | 红（开发／生产） | 红 |
| [042](findings/042-malformed-preload-crossorigin/README.md) | confirmed | 非字符串 preload crossorigin 没有诊断 | 红 | dev 红／生产绿 | 绿 |
| [044](findings/044-literal-spread-hydration/README.md) | confirmed | literal spread children 的 hydration id 顺序不一致 | 红 | dev 红／生产绿 | 绿 |
| [045](findings/045-server-optimistic-write-wording/README.md) | confirmed | SERVER_WRITE 段落将 optimistic no-op 写成落地数据 | 红 | 红（开发／生产） | 红 |
| [046](findings/046-held-derived-store-seed/README.md) | confirmed | Held derived store 的外部 draft 写入读取 pending seed | 红 | 红（开发／生产） | 红 |
| [047](findings/047-derived-store-accessor-example/README.md) | confirmed | Migration 代码把 derived store 当作 accessor 调用 | 运行时／类型红 | 运行时／类型红（开发／生产） | 红 |
| [048](findings/048-first-loading-held-signal/README.md) | confirmed | 首次 Loading 读取 held plain signal 时显示旧值 | 红 | 红（开发／生产） | 红 |
| [049](findings/049-document-live-channel-abort/README.md) | confirmed | Aborted document closes its live-hole channel twice | 红（observe 也红） | 红（开发／observe／生产） | 红 |
| [050](findings/050-literal-handler-attribution/README.md) | duplicate | 编译出的字面量原生 handler 没有 interaction 归因 | 红（observe 也红） | 红 | 不适用：dev 归因 |
| [051](findings/051-unnamed-attribution-owner-id/README.md) | confirmed | 未命名节点的诊断名称不回退到 owner id | 红 | 红 | 不适用：dev 名称 |
| [052](findings/052-transparent-ssr-slot/README.md) | confirmed | transparent 在 SSR 也会跳过 hydration 源记录与 slot | 红 | 红（开发／生产） | 红 |
| [053](findings/053-await-send-until-context/README.md) | confirmed | Live-send 示例 await 后需要先恢复 action 上下文 | 红 | 绿（开发／生产） | 红 |
| [054](findings/054-prearrived-recovery-wait/README.md) | confirmed | 已到达的服务端拒绝仍计入恢复等待时间 | 红（observe 也红） | 红 | 不适用：观测记录 |

编号 037 和 043 是审核中撤销的保留号，没有达到 finding 的最小红测试标准，不计入数量。001–003 仍为 fixed-upstream；005 与 050 为 duplicate，各有不同 repro 形状。

默认套件接受已登记差异的精确错误签名，并保留原始结果；`STRICT_FINDINGS=1` 可让宽测试也保持红色。findings 目录中的 desired-behavior 断言持续保持红色，没有修改框架代码。单文件进程隔离与外部超时由 scripts/run-suite.ts 负责，不能把整套挂起自动判为框架差异。

全文文档与代码合同见 [COVERAGE.md](tracks/docs/COVERAGE.md)，轮次证据见 [Wave 2](evidence/wave2-receipt.md) 和 [Wave 3](evidence/wave3-receipt.md)。
