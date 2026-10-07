---
type: Review
title: Independent report draft review
status: reviewed-before-revisions
model: claude-opus-5-5
---

## Wave4a 只读审查结论

以下问题都以本会话读过的文件为依据。已修复的 setup、版本和 TRIAGE 18/30 不再列入。

### P1：提交前应修正

1. **B/C 提案里的证据和上游 issue 只放在本地链接里，提交到 GitHub 后会失效**
   - 位置：`report/issues/16`–`26` 各项的 `Evidence:` 行（第 24/36/48 行），以及 `27-diagnostics-observability.md` 第 26、38、…、194 行。
   - 问题：这些行只链接 `../../findings/...`，文中写的 “related issues” 只存在于本地。用 Grep 在 16–27 中查 issue 号，没有任何匹配。finding frontmatter 里已登记的上游关联都没有带进提案：
     - 006 → #3092
     - 007 → #3728、#3524
     - 013、046 → #3612
     - 052 → #3012、#3609
     - 012 → #2883
     - 017 → #3723
     - 019 → #3754
     - 051 → #3063
   - 另外，A 类的 `Local evidence:` 链接同样会失效。
   - 修正：在每一项里写明 upstream issue 链接；本地链接标为 local-only，或在提交前删除。

2. **032、036 的严重度不一致，会影响 A 类的提交顺序**
   - `TRIAGE.md:48`（032）和 `:52`（036）都是 `low`，`evidence/triage.json` 也是 low。
   - 但 `README.md:18–19` 和 `issues/10:6`、`issues/11:6` 都写 `med`。
   - 修正：统一成同一个值，再按统一后的严重度重排 10、11 与 13–15。

3. **C 项 020 写错了诊断码**
   - `27-diagnostics-observability.md:68` 写的是 `FRAME_MARKER_MISSING`。
   - finding 020 的 README 和 `client.ts` 断言的都是 `FRAME_MARKER_CORRUPTED`，仓库其他地方也找不到 `MISSING`。
   - 修正：改为 `FRAME_MARKER_CORRUPTED`。

4. **C 项 010 把判断方向写反了**
   - `27-diagnostics-observability.md:22` 先说 “Implementation likely omits…”。
   - 但 `findings/010/README.md:19` 的结论是倾向文档错：应把禁令限定在有 computation 生命周期的 primitive。
   - 修正：改为先建议收窄文档，把补实现作为备选。

5. **提案 04 的 seroval 安装命令管不到 HEAD 实际用的版本，根因却依赖这个版本**
   - `04-live-decoder-stream-lifetime.md:24` 写了 `bun add seroval@1.6.8`。
   - 但 `build.ts` 用 realpath 解析到已链接的 checkout，recheck 日志里的路径也都指向 `.upstream/...`。所以 HEAD 下 `@solidjs/web` 加载的 seroval 来自上游 checkout，不是消费方项目。
   - 第 319 行的根因说明又依赖 “Seroval 1.6.8 Stream 没有 `__SEROVAL_STREAM__`”。
   - 修正：删掉这条命令，或注明它只影响 rc.13 对照；在 Versions 里写明 HEAD 构建实际用的是 seroval 1.6.8，依据是 `upstream-build.log:34`。

6. **提案 04 只测了 035 的 body error，没有测 premature EOF**
   - `TRIAGE.md:51` 和 finding 035 都把 “body error 或 premature EOF” 列入范围，原测试也有 `eof.test.ts`。
   - 但内联的 `repro.test.ts:39` 只调用了 `module.run()`，也就是 error 模式。
   - 修正：再加一个调用 `run("eof")` 的测试，或删去 EOF 的表述。

7. **提案 05（016）的报错文本和 “关闭 tree shaking 即通过” 都没有本轮证据**
   - 第 13/58 行写了 `GlobalQueue.O is not a function`，又写关闭 tree shaking 即通过。
   - 本轮 recheck 和 standalone 日志只有 `Promise { <rejected> }`，没有错误信息；`O` 还是混淆后的属性名，换个构建可能就变了。
   - `NO_TREE_SHAKE=1` 这条对照不在命令块里，本轮也没有重跑。
   - 修正：
     - 加上 `NO_TREE_SHAKE=1 BUILD_MODE=production bun test ./repro.test.ts` 作为对照命令，并注明验证时的 commit；
     - 让测试输出 rejection message；
     - 措辞写明是消费方 bundler 按 `sideEffects:false` 去除了注册副作用，不要写死混淆名。

8. **提案 02（008）的 “never settles” 说得过头了**
   - 标题和第 13 行这么写，但证据只是 200ms 内没有完成：watchdog 先到，development 立即完成。
   - 修正：改成 “does not settle within 200 ms in production (development settles immediately)”，或者加长等待时间后再保留 “never”。

### P2：建议修正

9. **提案 01 漏掉了 004 的 live 接管分支**
   - `findings/004/live-repro.test.ts` 在本轮 dev 和 prod 都是红，也计入了 99 次运行。
   - 提案只写了 CSR replacement 这一种形状。
   - 修正：补一句 SSR/LiveSource 接管后首次 reject 也会丢失，并给出最小代码或链接。

10. **rc.13 对照的出处与 finding README 互相矛盾**
    - 以下 README 仍写 rc.13 对照 “pending”、“由主线程执行” 或 “未声称已测”：
      - 011:28（明确写 “未声称已测”）
      - 029:31、032:26、009:32、014:30、031:21、020:19
      - 035:21 与本文件 :23 矛盾，036:23 与 :25 矛盾，038:21 与 :23 矛盾
    - 但对应提案把 rc.13 结果当事实陈述，其中 HEAD-only 还决定了 029、016、022 的 high/med 级别。
    - 按文件名，`evidence/*rc13*` 下没有 009、011、014、016、022、029、032 的原始日志。
    - 修正：给每个提案标出 rc.13 日志路径，或更新这些 README 里过时的 pending 文字。

11. **TRIAGE 中两个 duplicate 的构建列写错了**
    - `TRIAGE.md:21`（005）和 `:64`（050）写 “historical target only”。
    - 但 LEDGER 显示两者在 HEAD 上仍为红，只是本轮没有重跑。
    - 修正：改为 “not rechecked (duplicate; red at 53ef0e69)”。

12. **027 的分类不符合 TRIAGE 自己定的规则**
    - `TRIAGE.md:13` 规定 warning tier 类合同归 C，而 027 正是 SERVER_WRITE 警告在哪些构建出现的问题，却放在 B（`issues/24:14`）。
    - 修正：二选一。要么移到 27（计数会变成 B15/C16）；要么改规则，说明 RFC11 里关于发布策略的句子留在 B。

13. **B 项 015 只修了一处引文**
    - `issues/16:16` 只引用了 L20。
    - 但 finding 015 同时指出 L274 的迁移说明写着同样的 “untracked blocks”。
    - 修正：把 L274 一并列入修正（请在 dafad1db 下核对行号）。

14. **B 项 007 判断哪一方错的依据不足（判断性意见）**
    - `issues/20:16–20` 主张删掉文档里的说法。
    - 但被引的是一条规范性定义（“A zero-argument function is a tracked accessor, not a callback”），finding 本身也只写 “documentation/runtime contract discrepancy”。
    - 修正：并陈两侧，或倾向 runtime 补上 accessor 解包；如果判定 runtime 错，007 应归 A。

15. **提案 11（036）没有写出 dev 告警**
    - standalone 日志第 4 行显示，服务端对浏览器自己发起的条件请求输出了 “answered a scripted call with 304…” 告警。但 origin 实际收到了 `If-None-Match`，可见这个分类本身也不对。
    - 修正：在 Expected/Actual 里补上这条告警，帮助上游定位。

16. **045 与 027 引用的是 RFC11 的同一段**
    - `issues/22:20` 把 RFC11 L171 当作正确依据，而 `issues/24:16` 要求修改同一行的 “in all server builds”。
    - 修正：两项互相引用，让上游一次改完这一段。

### 覆盖核对

- **47 条 confirmed 恰好各出现一次**：A16 + B16 + C15 = 27 份提案，没有遗漏或重复。
- **TRIAGE 共 52 行**，与 001–054 去掉保留号 037、043 一致，包括 3 条 fixed-upstream 和 2 条 duplicate。
- **recheck 的 47 个 ID 全部到齐**：99 次运行中 12 次通过，87 次失败的运行合计 91 个失败测试（047 每次 2 个，049 每次 3 个），与合同一致。
