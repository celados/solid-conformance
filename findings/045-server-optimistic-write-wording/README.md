---
type: Issue
id: '045'
status: confirmed
versions:
  - "rc.13 production"
  - "rc.13 development"
  - HEAD 53ef0e69 development
  - HEAD 53ef0e69 production
area: docs/SSR/optimistic
upstream: []
found_by: docs-to-tests
---

# SERVER_WRITE 段落将 optimistic no-op 写成落地数据

预期 RFC08 将所有 server setter 描述为写入 inert data，因此 optimistic updater 执行一次、后续 read 返回新值。实际 ordinary signal 正控返回 1，但 optimistic updater 完全不运行、read 保持 0；开发和生产均反例成立。

```sh
bun test ./findings/045-server-optimistic-write-wording/repro.test.ts
BUILD_MODE=production bun test ./findings/045-server-optimistic-write-wording/repro.test.ts
```

[08-dev-diagnostics.md L635](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/08-dev-diagnostics.md#server_write) 说 “The write landed as inert data”。该段统括 signal、store、optimistic setter，没有区分后者。但 [11-server-components.md L169](https://github.com/solidjs/solid/blob/53ef0e69ea78bd6c7d88d5b82db2a13b8b85d712/documentation/solid-2.0/11-server-components.md) 明确 “optimistic writes hard no-ops since server output is settled state”。倾向 RFC08 文档有误：将 landed 描述限定为普通 setter，补充 optimistic no-op，保持 server 序列化 authoritative settled state 的正确语义。

## 缩减与去重

无 JSX、组件嵌套、effects、Loading、action、async 或浏览器；renderToString 中一个 setter updater 和一次 read。普通 signal 使用同一路径，证明 server render 在运行。独立 broader track 另外证实 store 更新 inert data、optimisticStore updater/no-op，组件均仅运行一次。三仓 open/closed 查询 `server optimistic setter` 无结果；现有027是deprecationwarning tier，不是optimistic数据落地措辞。日志和查询在 `evidence/wave3-finding045-*`；rc.13 由主线程统一比较。

Wave 3 独立版本对照：rc.13 development、rc.13 production 仍红；原始运行日志见仓库 evidence/ 中对应的 rc13 日志（其中 new-baseline-production 同时运行 039/045/047/048）。
