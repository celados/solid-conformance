---
type: Reference
title: 第 5 轮问题提交清单 — rc.15 与 HEAD
status: draft
head: e3716454129f8438b65257c95db5c383622494ba
router_head: 4a1685ec8f1ab045843b2ae590c7afe821f73d90
repro_commits: [44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759]
links: pending-orchestrator-push
---

# 问题提交清单

未向上游写入任何内容，也未执行推送。本清单仅供评审。复现链接指向本地固定的提交，待协调代理推送后才可远程访问。当前对比使用 Solid rc.15 与从源码构建的 Solid/Router HEAD；旧报告保留其原始版本证据。

## 提交门槛

只报告由人或代理编写的真实应用可能遇到的缺陷。不接受绕过类型检查、不切实际的写法，或只有集成开发者才会遇到的失败路径。文档中的代码片段若无法通过公开 TypeScript 类型检查，本身就是可报告的编译缺陷；不应绕过该错误，再人为制造运行时缺陷。每项发现都已在[逐项分诊记录](evidence/wave5-triage.json)中评估；旧章节草稿则依据当前 HEAD 文档，在[文档问题提交评审](evidence/wave5-docs-filing-review.json)中重新审查。

## 可提交批次：按应用影响排序

最终批次由 orchestrator 确定为五份，全部目标仓库为 `solidjs/solid`，顺序为 29、28、20、21、30。每个目录可独立安装；`bun run repro` 执行测试，`bun run run.ts rc15` 则一键建立并清理临时项目。维护者无需 conformance harness 或链接框架 checkout。

| 草稿 | 处置状态 | 标题 | 固定 repro 提交 | 理由 |
| --- | --- | --- | --- | --- |
| [29](issues/29-loading-lazy-hydration-order.md) | fileable | [2.0 rc.15 + next] Hydration reverses static and lazy children in Loading after a sibling | [44683a4](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/29-loading-lazy-hydration-order) | 可见的 hydration 子节点顺序变化；CSR 与静默通道对照通过。 |
| [28](issues/28-held-navigation-feedback.md) | fileable | [2.0 rc.15 + next] Held navigation never publishes delayed pending feedback | [44683a4](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/28-held-navigation-feedback) | 普通懒加载导航缺少常驻外壳的延迟状态提示；版本与编译器对照定位到 runtime。 |
| [20](issues/20-docs-05-errata.md) | fileable | [2.0 rc.15 + next] Documented Loading on accessor never rearms the fallback | [44683a4](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/20-loading-on-accessor) | 复制文档的 on accessor 保留旧内容；同一程序的值形式显示 pending。 |
| [21](issues/21-docs-06-errata.md) | fileable | [2.0 rc.15 + next] Documented nested derived-store refresh is rejected by public types | [44683a4](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/21-nested-refresh-types) | 文档的 nested refresh 被公开类型拒绝；root refresh 对照通过。 |
| [30](issues/30-documentation-errata.md) | fileable | [2.0 rc.15 + next] Solid 2 documentation errata: untrack writes, pinned derivations, effect error callback, storePath, derived-store migration example | [44683a4](https://github.com/celados/solid-conformance/tree/44683a4dba3bd8d9f87c30e5cecb8b2ad4f94759/report/repros/30-documentation-errata) | 五个文档／类型示例分别复现；修正后的对照通过，合并为一份勘误。 |

草稿 16、17、18、19、26 已标为 superseded，由 30 合并替代。它们不单独提交。干净安装与一键入口都已逐项验证：安装成功，测试按文档／渲染预期失败。详情见[提交准备回执](evidence/wave5-filing-receipt.md)与[原始运行结果](evidence/wave5-filing-repros/summary.json)。

## 暂缓或排除的提案

| 提案或用例 | 处置状态 | 理由 |
| --- | --- | --- |
| 01–09, 11–12 | excluded-fixed | 其中 12 项原始发现均已在 rc.15 和 HEAD 上通过测试；修复提交见[修复溯源记录](evidence/wave5-fix-provenance.json)。不要重新提交已关闭的这一批问题。 |
| 10 / #3896 / 032 | held | 仍然测试失败，但已撤回这条集成层资产解析器失败路径。 |
| 13 / #3899 / 026 | held | 仍然测试失败，但已撤回这个影响较小的 cookie 名称边界用例。 |
| 14 / #3900 / 034 | held | 仍然测试失败，但已撤回这条不可渲染对象／绕过类型检查的路径。 |
| 15 / #3901 / 044 | held | 开发模式下仍然测试失败，生产模式对照测试通过；已撤回这种不常见的字面量展开形式。 |
| 17 / 046 | held | 人为构造的累加式草稿派生逻辑；未证实普通应用会因此失败。 |
| 18 / 041 | held | 仅涉及水合跟踪的调用次数，没有额外的真实请求或错误 DOM。 |
| 20 / 048, 052 | held | 涉及已提交的普通 signal 边界表述／内部 SSR 源槽位分配；并非撕裂（tearing）用例。 |
| [22](issues/22-docs-08-errata.md) | held | 关于无效服务端写入的表述；未发现合法应用用法下的失败。 |
| [23](issues/23-docs-10-errata.md) | held | 类型化数组传输成功；仅涉及过于宽泛的显式启用表述。 |
| [24](issues/24-docs-11-errata.md) | held | 涉及诊断警告层级与集成帧身份的表述。 |
| [25](issues/25-docs-12-errata.md) | held | 涉及仅供集成使用的直接调用钩子层级。 |
| [27](issues/27-diagnostics-observability.md) | held | 属于诊断／工具契约的一组问题，未证明普通应用会出现功能异常；格式错误输入的分支不满足提交门槛。 |
| 056 | held | 现有 #3851 的新编译 JSX 复现；已记录为重复项，不再另写重复的问题草稿。 |

## 证据局限

055 首次失败于 **Solid rc.14**，而非 rc.15。Router 固定为 next.30；切换编译器 rc.13/rc.14 后，结果仍随运行时版本变化。next.39 与 Router HEAD 在受支持的 Solid 版本上均可复现；与旧运行时不兼容的组合不计为缺陷。扁平导出产物与受支持的 `solid` 导出产物均已测试。已测试的不使用 Router 的过渡场景正常，因此运行时中的确切问题位置仍未知。

覆盖面较广的历史测试套件包含过时／内部帧，以及仍会独立于本批提交而失败的诊断断言；原始失败结果予以保留，不将其重新标记为框架缺陷。完整套件与生成式测试轨道的执行回执记录了这些局限。内部手写、无作用域的 `ssr()` 漏洞不算一项发现：尚未证实存在编译生成的或用户可触达的反例。

[执行回执](evidence/wave5-receipt.md)记录了全部四次包含 93 个文件的执行尝试，以及未完成的 seed-20261007 属性测试运行。本批问题凭各自独立的最小失败测试即可提交；并未声称整个套件全部通过，也未声称生成式测试覆盖穷尽了所有情况。
