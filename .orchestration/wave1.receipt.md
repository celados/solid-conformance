已完成并合入 `main`，提交 `9266827`，工作区干净。详见 [README](/Users/dio/Projects/solid-conformance/README.md)。

```sh
bun test                         # 默认套件
CASES=200 bun run properties      # 扩大生成测试
bun run upstream                 # 构建并链接 next
EXPECT_FIXED=1 bun run regressions
bun run upstream --restore       # 恢复 rc.13
bun test ./findings               # rc.13 上三个复现均应失败
```

正式收据包含 **420 次生成树检查、3,046 次浏览器运行**，含跨阶段、跨版本重复。默认入口验证为 **8 pass / 0 fail**；三个 repro 在 rc.13 全红，在构建的 HEAD `53ef0e69` 全绿。

[Ledger](/Users/dio/Projects/solid-conformance/LEDGER.md) 记录：

- **001 · duplicate**：streamed createStore + keyed For 导致 hydration 崩溃，对应 #3764。
- **002 · duplicate**：子组件 setup 读取新 async iterable，SSR discovery 不收敛，对应 #3734。
- **003 · duplicate**：TSRX setup 声明省略分号时编译失败，对应 #3762。

Router 没有 rc.13 发布，实际固定为 `2.0.0-next.35`。未进行任何 upstream 写操作。

限制：生成树分支固定，尚未覆盖任意 rejection、导航、重连、pending 时卸载和完整事件交错；旧版 #3338/#3687 矩阵未验证。Wave 2 建议优先加入这些状态转换，再开展 docs-to-tests 和 production 构建验证。

