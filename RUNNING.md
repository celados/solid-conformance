---
type: Reference
title: Solid 2 conformance — Wave 5
description: Bun、系统 Chrome、HEAD 优先的 CSR／流式 SSR／hydration 与文档契约测试。
---

# Solid 2 conformance

本项目只验证和记录差异，不修复框架，也不向上游写入。需要 Bun、系统 Google Chrome，以及上游 native compiler 构建要求的 Rust 工具链。

## 运行

```sh
bun install --frozen-lockfile
bun run upstream                    # 每轮刷新 next tarball，构建并链接 HEAD
bun run router:upstream              # 构建并链接 Router HEAD
bun run vite:upstream                # 构建文档所需的 Vite companion next 快照
bun test                            # HEAD development；每文件一个独立、有时限的 Bun host
bun run test:production              # 选择 production 导出和编译条件
bun run check
bun run regressions
CASES=200 SEED=20261007 bun run properties
TRANSITION_CASES=80 SEED=20261008 bun run transitions
ROUTER_TRANSITION_CASES=20 SEED=20261010 bun run router:transitions
TRANSPORT_CASES=20 SEED=20261009 bun test ./tracks/transport/transport.test.ts
bun run coverage                    # 合并逐句证据，更新 inventory/COVERAGE
bun test ./tracks/docs/inventory.test.ts
bun run docs
STRICT_FINDINGS=1 bun run docs        # 文档差异也使宽测试失败
STRICT_FINDINGS=1 bun run transitions # 004 也使 property 失败，并进行 shrinking
```

默认 suite 逐文件运行全部 tracks，保持 intentional 多 bundle 用例在同一个 host 内；其余文件不共享进程级 SSR 插件、观察器和事件存储。每文件外部预算默认 600000ms，可用 SUITE_FILE_BUDGET_MS 调整，超时终止该文件拥有的进程组。每文件原始日志和计数在 artifacts/suite-<mode>/ 与 suite-<mode>.json。单文件命令保留 `bun test ./tracks/...test.ts`，findings 不参与默认发现。

默认测试识别已记录差异的具体失败签名，同时保存原始失败，独立 repro 保持红色。未知错误、不同失败签名、console／hydration 问题仍使测试失败。默认绿色不表示没有 finding。

## 版本和对照

默认 `TARGET=head` 会拒绝使用未链接的发布包；运行时回执记录真实链接路径、SHA 和构建模式。包的 version 字段仍可能显示 rc.15，判断 HEAD 应使用 `.upstream/active.json`。

```sh
UPSTREAM_REF=<SHA-or-ref> bun run upstream
bun run upstream --build-only
bun run upstream --link-built
bun run upstream --restore
bun run router:upstream --restore
TARGET=rc15 bun test ./findings/004-derived-store-rejection/repro.test.ts
TARGET=rc15 BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
bun run upstream --link-built         # 对照结束后恢复 HEAD
```

`solid-js`、`@solidjs/web`、signals、compiler、diagnostics 的发布基线通过 `bun add --exact` 固定为 rc.15。Router 没有 rc.15 版本，锁定其独立发布线 `2.0.0-next.39`。HEAD 脚本通过 Bun 调用 Rollup、TypeScript、NAPI，下载 tar 快照到 `.upstream/`，不修改上游 checkout。Router HEAD 通过 `bun run router:upstream` 构建 next tar 快照并链接，SHA 写入 `.upstream/router-built.json`。`--build-only` 仅构建，`--link-built` 链接已有快照，`--restore` 恢复发布包。

## 每项差异的单命令复现

```sh
bun test ./findings/004-derived-store-rejection/repro.test.ts
bun test ./findings/005-keyed-reconcile-identity/repro.test.ts
bun test ./findings/006-storepath-export/repro.test.ts
bun test ./findings/007-loading-on-accessor/repro.test.ts
BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
```

001–003 是历史 fixed-upstream，rc.15 与 HEAD 都通过；本轮另有 12 项旧 confirmed 修复。005 是已有订阅剪枝设计的文档措辞差异，状态为 duplicate。预期、实际、版本、去重和缩减记录见 [LEDGER.md](LEDGER.md)。

## Harness 与轨道

同一个 TSX AST 通过 native compiler 分别构建 DOM 和 SSR bundle。CSR 和 hydration 都使用 Playwright `channel: 'chrome'`；不下载浏览器。流式 hydration 的完整 document 由 Solid SSR 生成，使用 HydrationScript、NoHydration 和带 `app` renderId 的 Hydration 区域，让框架安排 payload 与 module 启动顺序。DOM 比较仅移除 hydration 标记、注释及传输 script/template，保留内容与业务属性。

- `harness/timing.ts`：deferred promise、多订阅可控 iterable、reject/end/return、开关计数和 tick stepping。
- `tracks/regressions`：五个历史 issue 家族；生产模式的 optimistic 矩阵只跑 attribution off，因为 OBSERVE 不在生产包中。
- `tracks/properties`：小树生成、CSR／hydration 等价、settle 排列、内部或根节点 Loading／Show 包装不变、迭代器释放、收敛与 shrink。
- `tracks/transitions`：八个转换家族、四种 primitive、两种 async source；失败、supersession、pending remount、共享／独立路由源、失败 action 和点击交错。
- `tracks/docs`：全文逐句及代码合同 inventory；221 个完整代码块另有 source review，覆盖表与不可测试原因见 [COVERAGE.md](tracks/docs/COVERAGE.md)。类型、diagnostics、真实 Vite dev／production 集成使用独立测试。
- `tracks/router`：next.39 的匹配、导航、preload、query/liveQuery、action/submission、redirect；`tracks/transitions/router-transitions.test.ts` 再验证 settle 顺序、SSR/hydration 与透明包装。
- `tracks/frames`：server functions/components 的真实 HTTP wire、SSR heads、slot/ref、生命周期、取消和 reconnect。
- `tracks/transport`：测试控制的真实 SSE server，包括慢首值、断线、重连、拒绝和 teardown。
- `tracks/records`：公开观察通道、invocation/render/call/frame/trace 的身份与计时、真实 Chrome performance entries。

回执写入 `artifacts/`。properties 可用 `RECEIPT`、transitions 可用 `TRANSITION_RECEIPT`、docs 可用 `DOC_RECEIPT` 选择输出路径；fast-check 用 `SEED` 和 `REPLAY_PATH` 重放。交付证据保存在 [evidence/](evidence/)。

## 交付与限制

[LEDGER.md](LEDGER.md) 给出每项差异、版本矩阵及单命令 repro；[Wave 2](evidence/wave2-receipt.md) 与 [Wave 3](evidence/wave3-receipt.md) 保留轮次证据。默认绿色表示没有未知错误；已经登记的原始红例没有改写成通过断言。

HEAD 构建与 Vite 快照都保存在当前 checkout 的 git-ignored .upstream/，不依赖已经结束的 Wave 1／2 worktree。Vite plugin 独立 next 快照的 SHA 在 .upstream/vite-built.json；本轮也构建并测试 Router HEAD；源快照在 `.scratch/router/<SHA>`，不修改其他 checkout。系统 Chrome 的版本记录在运行时浏览器证据，既不下载内核也不替换用户的日常 Chrome profile。

按句测试不等于穷举所有树或所有 async 排列：每棵树使用全排列或有界采样，生成器与 shrinker 保留 seed／replay。Bun-only 下未实测 Node、workerd、Deno；HTTP/1.1 local wire 不代表 HTTP/2 carrier。不可到达的公开 SSR 恢复条件、缺少反事实基准的绝对成本保证和不可公开计数的内部零分配等，逐项列为 untestable，而不是算已覆盖。SolidStart 尚无可在本轮构建的 Solid 2 发布版；核心/Vite server functions/components 的实际公共 API 已独立测试。

## Wave 5

Solid HEAD: `e3716454129f8438b65257c95db5c383622494ba`；Router HEAD: `4a1685ec8f1ab045843b2ae590c7afe821f73d90`。发布 Vite plugin 为 registry 的 `latest`（`3.0.0-next.50`），其 rc.14+ peer 范围包含 rc.15；`next` tag 仍停在 next.35，不能用它推断最新兼容版本。

`bun run findings:recheck` 在当前已选定的包图上逐一运行所有 finding 的 development/production，保留 pass/fail/skip 和子进程 PID。observe 合同单独补跑。结果与 filing bar 在 [Wave 5 证据](report/evidence/wave5-head-matrix.json) 和 [FILING](report/FILING.md)。零测试、缺失的历史 API、类型 bypass、旧文档断言失败均不自动当作当前框架 finding。

新生成轨道：

```sh
HELD_UI_CASES=100 SEED=20261008 bun test ./tracks/transitions/held-ui.test.ts
HELD_MOUNT_CASES=100 SEED=20261007 bun test ./tracks/properties/held-mount.test.ts
STRICT_FINDINGS=1 bun test ./tracks/transitions/held-ui.test.ts
```

新 focused harness 使用 Router 的 `solid` export 条件，并由同版本 native compiler 编译其 JSX；旧宽轨道继续保留原 flat-bundle 对照。055/056 独立 repro 保持 desired-behavior 红断言；生成轨道只识别它们精确的中间帧签名，最终收敛、console/pageerror 和未知错误仍必须通过。rc.13/rc.14 历史比较可在 `bun run scripts/wave5-bisect.ts` 创建的隔离 host 中重跑，不改主 checkout 的冻结基线。

本轮执行结果见 [Wave 5 回执](report/evidence/wave5-receipt.md)。四个历史宽套件均执行到第 93 个文件，但仍有红例和超时；原 properties seed `20261007` 未完成全部 200 cases。回执分别列出完成范围、预算限制与原始日志，不能将这次重跑称为全绿或完整随机覆盖。
