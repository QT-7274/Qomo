## Deferred from: code review of b0-2 (2026-03-31)

- **W1** `generateId()` 降级方案碰撞风险 — B0.1 已有模式，非本次引入。考虑后续统一改用 `crypto.getRandomValues()` 降级。
- **W2** Helper 无运行时输入校验 — Architecture doc 已规划 Zod，应在引入 Zod 时统一补齐。
- **W3** `writebackFailureReason` / `HandoffResult.failureReason` 应按 outcome 条件必填 — 需 discriminated union 重构，scope 较大，建议在 V5 或 O1 story 中处理。
- **W4** `FallbackOption.optionType` 与 `DecisionResultType` 语义耦合但独立定义 — 结构性风险低，可在引入更多 fallback 逻辑时统一。
- **W5** `DecisionEvent.issueCount` 反范式化可能与 `hasCapabilityIssues` 不一致 — Helper 已保证一致，手工构造风险低，可在引入 Zod 校验时加固。

## Deferred from: code review of v1-launch-entry-and-object-selection (2026-04-02)

- **D1** `selectWorkUnit` 闭包捕获 stale `allWorkUnits`/`snapshotMap` — MVP 阶段单标签页使用可接受，后续需增加刷新机制或 optimistic refetch。
- **D2** N+1 快照查询（fetchData 中每个 WU 独立调用 `getLatestSnapshot`）— MVP 规模 (<100 WU) 性能可接受，后续需改为批量查询。
