---
id: '054'
status: confirmed
versions:
  - 'HEAD 53ef0e69 (development and observe)'
area: diagnostics/recovery
upstream: []
found_by: docs
---

# 已到达的服务端拒绝仍计入恢复等待时间

文档 RFC08 L896 将 `waitedMs` 描述为从注册到拒绝到达的等待，并明确称拒绝在 hydration 前到达时为 0。完整服务端错误输出在 hydration 前已经解析，实际记录仍测量注册到客户端恢复微任务执行之间的时间；控制时钟得到 100，而非 0。

```sh
bun test findings/054-prearrived-recovery-wait/repro.test.ts
```

`BUILD_MODE=observe` 同样失败；production 无记录，测试明确 skip。rc.13 由主分支隔离 baseline 补验。

倾向文档错误：运行时测量的是客户端恢复调度等待，不只网络上的拒绝到达等待。不是微秒舍入差异；公有 `performance.now` 测试时钟让三个读数分别为 1000、1100、1200。

服务端先完整 await SSR 流，随后才返回静态 HTML。错误输出之后的尾部 marker、`DOMContentLoaded` 和微任务正控保证全部服务端脚本先于 hydration；另有最终 recovered DOM 与恰一条记录正控。缩减后只保留一个 Loading 和一个异步源，无 router、frame、请求重连或用户事件。

2026-10-08 查询 solidjs/solid、solidjs/solid-router、solidjs/solid-start 的 open 与 closed issues：`recovery waitedMs`、`recovery hydration timing` 六次搜索均无结果。与 021 的 server outcome 枚举矛盾不同，这里检查已到达错误的客户端等待时钟。
