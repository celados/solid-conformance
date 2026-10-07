---
type: Reference
title: Discrepancy ledger
description: 最小红测试、版本对照、上游去重及设计裁定。
---

# Ledger

本轮 HEAD：`53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`。全部上游操作只读。

| ID | Status | 标题 | HEAD | rc.13 | 相关上游 |
| --- | --- | --- | --- | --- | --- |
| [001](findings/001-streamed-store-keyed/README.md) | fixed-upstream | Streamed createStore + keyed For hydration halt | 通过 | 失败 | [#3764](https://github.com/solidjs/solid/issues/3764) |
| [002](findings/002-iterable-discovery/README.md) | fixed-upstream | Fresh async iterable child setup never converges in SSR | 通过 | 失败 | [#3734](https://github.com/solidjs/solid/issues/3734) |
| [003](findings/003-tsrx-asi/README.md) | fixed-upstream | Native TSRX scalar setup ASI | 通过 | 失败 | [#3762](https://github.com/solidjs/solid/issues/3762) |
| [004](findings/004-derived-store-rejection/README.md) | confirmed | Replacement derived-store rejection loses Errored routing | 开发／生产失败 | 开发／生产通过 | [#2997](https://github.com/solidjs/solid/issues/2997)、[#3769](https://github.com/solidjs/solid/issues/3769)，机制不同 |
| [005](findings/005-keyed-reconcile-identity/README.md) | duplicate | Reconcile identity wording omits never-subscribed pruning | 字面文档断言失败 | 字面文档断言失败 | [#2902](https://github.com/solidjs/solid/issues/2902)，有意设计；需补文档限定 |
| [006](findings/006-storepath-export/README.md) | confirmed | Documented storePath missing from browser solid-js | 失败 | 失败 | [#3092](https://github.com/solidjs/solid/issues/3092)，相关 API 提案 |
| [007](findings/007-loading-on-accessor/README.md) | confirmed | Documented Loading zero-argument on accessor does not rearm | 开发／生产失败 | 开发／生产失败 | [#3728](https://github.com/solidjs/solid/issues/3728) 为 html getter；[#3524](https://github.com/solidjs/solid/issues/3524) 为 outside-hold，机制不同 |
| [008](findings/008-production-refresh/README.md) | confirmed | refresh completion hangs only in HEAD production | 生产失败、开发通过 | 开发／生产通过 | [#3738](https://github.com/solidjs/solid/issues/3738)、[#3178](https://github.com/solidjs/solid/issues/3178)，症状不同 |

## 去重与判定

001–003 的去重来源和 Wave 1 证据保留在各 finding 及 `evidence/wave1-*`。004–008 搜索 Solid、Router、Start 的 open 和 closed issues，关键词及结果保存在 `evidence/wave2-dedupe-*.json`。搜索不是不存在重复 issue 的数学证明；记录的是已检查的查询和邻近问题。

004 和 008 是 HEAD 相对 rc.13 的回归。006 为公共导出与文档不一致；007 更可能需要修正文档中的 JSX 写法。005 保留字面文档的红测试，但遵循 #2902 的裁定，不当作新运行时 bug。

默认轨道仅接受这些已知的具体失败签名，原始错误仍写入回执；`STRICT_FINDINGS=1` 可让宽测试也保持红色。findings 目录每项都有单命令 desired-behavior repro。

## 覆盖边界

本轮验证了开发／生产的小树与状态转换，以及 137 个去重文档行为（141 个 case ID）；文档全文总数尚未审计，原工作单的逐句全覆盖没有完成。真实网络 reconnect、server-component transport 和完整 diagnostics 覆盖仍待补。详见 [Wave 2 回执](evidence/wave2-receipt.md) 与 [文档覆盖清单](tracks/docs/COVERAGE.md)。
