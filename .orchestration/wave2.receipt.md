已提交并合并到 main：`e33b746`。main 交付检查 **10/0**，TypeScript 通过。

测试 HEAD：`53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712`。

开发／生产各运行：5 个回归家族、100 棵随机树、48 个转换场景、163 次文档断言执行。文档覆盖 **137 个声明／全文总数尚未盘点**，逐句全覆盖仍未完成。

| ID | 状态 | 差异 | HEAD／rc.13 |
|---|---|---|---|
| 004 | confirmed | derived store 拒绝未到 Errored | 失败／通过 |
| 005 | duplicate | reconcile 未订阅代理剪枝，#2902 已裁定 | 字面断言均失败 |
| 006 | confirmed | 浏览器缺少 storePath 导出 | 均失败 |
| 007 | confirmed | Loading on accessor 不重新显示 fallback | 均失败 |
| 008 | confirmed | production refresh 不收敛 | 生产失败／通过 |

```sh
bun test
bun run test:production
bun test ./findings/004-derived-store-rejection/repro.test.ts
```

完整命令、版本矩阵与证据见[回执](/Users/dio/Projects/solid-conformance/evidence/wave2-receipt.md)。

Wave 3 建议先补全文声明盘点及 diagnostics、类型、server components；当前 reconnect 仅模拟换源，真实网络生命周期仍待验证。