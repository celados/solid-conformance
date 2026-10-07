---
type: Reference
title: Wave 2 verification receipt
status: partial-coverage
upstream_commit: 53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712
description: HEAD／rc.13 与开发／生产的执行数量、发现和未完成范围。
---

# Wave 2 回执

004 和所列文档差异已完成最小复现、版本对照及去重，代码已提交到 wave2，交付时合并 main。**原 Wave 2 工作单的全文逐句文档覆盖尚未完成**；不以默认绿色掩盖这个缺口。

## 目标与运行环境

本轮开始重新解析 next、下载 tarball 并构建，HEAD commit 为 `53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`。该 SHA 与 Wave 1 相同。solid-js／web／signals／compiler 来自同一快照；Router 为锁定的 `2.0.0-next.35`。发布基线为 rc.13。Bun 1.4.2，Playwright 使用系统 Chrome channel，未下载浏览器，未向任何上游写入。

## 执行数量

| 轨道 | HEAD development | HEAD production | 结果 |
| --- | --- | --- | --- |
| harness | 2 个 Bun 测试 | 2 个 Bun 测试 | 通过 |
| regressions | 5 个历史 issue 家族 | 5 个历史 issue 家族 | 通过；optimistic 矩阵 dev 16／prod 8，因为生产不提供 attribution |
| properties | 100 随机树、722 次 Chrome run | 100 随机树、722 次 Chrome run | 无未知失败 |
| transitions | 40 随机场景 + 8 必跑、240 次 Chrome run | 40 随机场景 + 8 必跑、240 次 Chrome run | 004 签名各记录 20 次；无其他失败 |
| docs | 141 case ID、137 去重行为句子、163 执行结果 | 同样 163 执行结果 | dev 3 个已知失败；prod 6 个已知失败，映射至 005–008 |
| findings | 8 个单项：4 通过／4 失败 | 8 个单项：3 通过／5 失败 | 与下表完全一致 |
| rc.13 comparison | 004–008：2 通过／3 失败 | 004–008：2 通过／3 失败 | 004、008 通过；005–007 失败 |

两种构建使用相同 seeds，100 + 100 是 **200 次随机树检查，100 个种子生成的树样本**，不是 200 个不同树；状态转换也复用相同抽样。主 properties/transition 批次合计 1,924 次浏览器运行。首轮 10 个生产树 smoke 及探测／shrinking 不计入以上主批次数量。

开发联合批次为 9/0，另跑 transitions 为 1/0。生产最初发现 regression harness 错误调用了只适用于 dev/observe 的 captureArtifact；改成 production 的八个 attribution-off 组合后，五个 regression 家族重新跑至 5/0。日志保留这次失败及修正后的运行，不能把初始生产联合批次说成全绿。docs、transitions、properties 的生产最终批次均通过已知签名识别。

## 新记录及版本矩阵

| ID | Status | 一句话 | HEAD dev | HEAD prod | rc.13 dev | rc.13 prod |
| --- | --- | --- | --- | --- | --- | --- |
| 004 | confirmed | derived store 替换请求的拒绝被旧值遮蔽，未到 Errored | 红 | 红 | 绿 | 绿 |
| 005 | duplicate | reconcile 文档省略未订阅代理的剪枝限定，已有 #2902 裁定 | 红 | 红 | 红 | 红 |
| 006 | confirmed | 文档提供的 storePath 未从浏览器 solid-js 导出 | 红 | 红 | 红 | 红 |
| 007 | confirmed | 文档给出的零参数 Loading on accessor 不会重新显示 fallback | 红 | 红 | 红 | 红 |
| 008 | confirmed | production refresh 的完成 Promise 不收敛 | 绿 | 红 | 绿 | 绿 |

005 的独立测试直接使用 signals production entry；它的 dev/prod 列表示两次执行环境，未声称切换了两个信号引擎。006 的独立编译 repro 明确选择 browser production entry；development 缺失通过 docs 轨道另行验证。004、007、008 在系统 Chrome 中运行真实所选客户端构建。

001–003 在本轮 HEAD 两种构建均通过，状态改为 fixed-upstream；rc.13 的失败由 Wave 1 独立验证保留。新记录对应的源码、缩减说明与命令见 [LEDGER](../LEDGER.md)。

## 命令

```sh
bun run upstream
bun test
BUILD_MODE=production bun test
bun run check
CASES=100 SEED=20261007 bun run properties
TRANSITION_CASES=40 SEED=20261008 bun run transitions
bun run docs
STRICT_FINDINGS=1 bun run docs
bun test ./findings/004-derived-store-rejection/repro.test.ts
bun test ./findings/005-keyed-reconcile-identity/repro.test.ts
bun test ./findings/006-storepath-export/repro.test.ts
bun test ./findings/007-loading-on-accessor/repro.test.ts
BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
bun run upstream --restore
TARGET=rc13 BUILD_MODE=production bun test ./findings/008-production-refresh/repro.test.ts
bun run upstream --link-built
```

## 文档 covered / total 和未完成范围

**137 / 全文总数未完成审计**。已登记 141 个可执行 case ID（包括同一句子的 primitive 变体），覆盖 10/12 RFC 章节；[COVERAGE](../tracks/docs/COVERAGE.md) 列出每项句子、文件、执行平台和章节缺口。不得将其写成 137/137 全覆盖。

09 类型／JSX ownership、11 实验性 server components 尚无专门轨道；08 只覆盖 owned-write 两项，10 缺客户端 RPC/live/single-flight 集成；其他章节仍有未覆盖组合。性能历史数字、future/open questions、DevTools 视觉布局不直接计入确定性运行时断言；可测试但未完成的内容保留为缺口，不标成 untestable。

## Harness 限制与 Wave 3

reconnect 目前只是替换 source generation，不是真实网络断线重连。SSR/hydration 检查的是成功初始数据，之后在客户端驱动 rejects/操作；尚未生成服务端流式拒绝交错。事件序列是八种模板，root Loading/Show wrapping 应用在转换测试；原小树 property 可包装内部子树。错误计数依靠 configureClientErrors 和 nearest-fallback，未覆盖任意嵌套错误图。定时由实际微任务／event-loop turns 驱动，tick 数及页面／statement watchdog 限制收敛。

rc.13 production 的宽 SSR bundle 曾在初始化 GlobalQueue 时失败，发生在 baseline 的通用诊断导入图中；未将这个启动错误当作 004/007/008 的复现。CSR-only repro 不加载无关 SSR artifact，最终基线结果来自可运行的真实客户端构建。rc.13 production 的广泛 SSR 性质尚未完成资格验证。

Wave 3 优先补齐全文声明盘点及 08/09/10/11 的缺口，加入真实 RPC/frame transport 断连、重连、取消和 server-side rejected hydration，然后把转换 grammar 扩为可缩减的任意操作列表。报告上游前应由人复核 005/007 的文档裁定，并再次刷新 HEAD 跑最小 repro。

## 证据

本目录的 wave2 properties/transitions/docs JSON 保存 runtime SHA、seed、执行计数及原始失败。`wave2-findings-*.log`、`wave2-repros-rc13-*.log` 保存版本对照；`wave2-dedupe-*.json` 保存三个仓库的 open/closed 查询。宽搜索最多取 100 个结果，相关具体查询用于收窄；不声称穷尽所有历史 issue。全部红测试都保留 desired-behavior 断言，没有改成“期待 bug”来充当最小 finding。
