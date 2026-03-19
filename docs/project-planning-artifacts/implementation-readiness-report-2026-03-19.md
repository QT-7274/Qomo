---
workflowType: implementation-readiness
project_name: Qomo
user_name: drogbaqu
date: '2026-03-19'
status: final-pass
sourceOfTruth:
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-03-09.md
  - docs/analysis/product-brief-Qomo-2025-12-27.md
formalInputs:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/prd-handoff-to-design.md
referenceOnlyInputs:
  - docs/prd.md
  - docs/ux-design-specification.md
  - docs/project-planning-artifacts/architecture.md
---

# Implementation Readiness Status Sync

**Date:** 2026-03-19  
**Project:** Qomo  
**Base assessment:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-09.md`  
**Follow-up carrier:** `docs/analysis/product-brief-Qomo-2025-12-27.md`

## 结论

**当前 `implementation-readiness` 已完成最终收口，并可按顺序进入 `sprint-planning`。**

更准确地说：

- `2026-03-09` 的 authoritative report 起点结论是 **`NOT READY`**；
- `2026-03-11` 的 Wave A / Wave B / Wave B-2 已把 coverage、story 粒度、implementation boundary 收紧到可复核状态；
- 本轮已把 `FR28`、`FR71`、`FR72` 以**显式采纳记录**落盘；
- 随后按同一 authority chain 完成了一次 **Wave C / final verifier pass**；
- 因此，当前状态已从“剩余少数 P0 未决 + 尚未最终复核”推进为：**P0 已采纳、final verifier 已通过、gate 可解除**。

## Authority order（当前仍有效）

- **source of truth**: workspace-native `spec`
- **formal inputs**:
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/prd-handoff-to-design.md`
- **validated carrier / follow-up carrier**:
  - `docs/analysis/product-brief-Qomo-2025-12-27.md`
- **legacy / reference-only**:
  - `docs/prd.md`
  - `docs/ux-design-specification.md`
  - `docs/project-planning-artifacts/architecture.md`

## 2026-03-11 之后已确认完成的收口

### 1. Wave A：Step 3 的 `42` 个 finding 已完成 disposition

已在 `docs/analysis/product-brief-Qomo-2025-12-27.md` 的 **Wave A — Step 3 coverage disposition 清单（2026-03-11）** 中明确：

- `42` 个 finding 已全部归类完成
- `15` 项补入当前 baseline
- `24` 项标记为 `deferred or future`
- `3` 项保持 open 并说明阻塞影响

这意味着：

- **Step 3 不再存在“大量悬空未分类项”**
- generic import/export、batch migration、favorites、reporting、auth/sync 等内容已被明确后置，而不是继续模糊悬挂
- P1 / P0 blocker 也被明确缩小到一组可点名的条目

### 2. Wave B：过粗 Story slice 已拆细，依赖语义已收紧

已在 **Wave B — 拆小过粗 Story slice 并收紧依赖语义（2026-03-11）** 中明确：

- `W2` 已拆成 `W2a / W2b / W2c`
- `V3` 已拆成 `V3a / V3b / V3c`
- `O4` 已拆成 `O4a / O4b / O4c`
- 依赖表达统一成：
  - `must-have predecessors`
  - `may-run-in-parallel-with`
  - `owner-decision inputs (non-predecessor)`

这意味着：

- `2026-03-09` Step 5 指出的“story family / mini-epic 过粗问题”已经被**定向修正**
- 旧的松散依赖写法已被替换成更机械、可执行的表达
- 当前 baseline 在 story 结构层面**比 3 月 9 日更接近可复核状态**

### 3. Wave B-2：保留 Story 已补最小 implementation boundary

已在 **Wave B-2 — 为保留 Story 补齐最小 implementation boundary（2026-03-11）** 中明确：

- 为保留 Story 补了最小 AC
- 补了关键异常 / 降级场景
- 补了完成后可观察结果
- 补了最小 FR trace refs
- 对 open questions 做了参数化标注

这意味着：

- `2026-03-09` Step 5 所说的“AC 缺失 / FR trace 仅外置维持”问题，已经**被最小化修补到可供 verifier 复核的程度**
- 但这些补丁**不等于 ready-for-dev packet**，也**不等于 Wave C 最终 readiness judgement 已完成**

## 已完成的 P0 收口与最终复核前提

### A. `FR28 / FR71 / FR72` 已完成显式采纳

本轮不再把三项 P0 保留为 open decision，而是正式采纳为当前 2.x `implementation-readiness` 的生效口径：

1. **`FR28`**：采用“**显式风险提示 + 可选遮罩建议**，默认非阻断”。
2. **`FR71`**：采纳“**Web 只承担 design-time reference catalog，runtime source-of-truth 仍归 VS Code discovery**”。
3. **`FR72`**：采纳“**当前首批只开放声明级可见深度**，不冻结完整能力治理平台深度”。

### B. 采纳后的边界约束仍保持不变

这次采纳**只冻结 guardrail / owner / visibility boundary**，并**不**意味着提前冻结下列工程级事项：

- schema / OpenAPI / endpoint / DB / infra / code
- 最终事实源策略的工程实现细节
- 完整能力库治理 UI、版本策略、刷新策略
- `sprint-planning`、`create-story`、`dev-story` 才应决定的 implementation 下游内容

### C. 其他 open questions 仍继续保持 open

除 `FR28 / FR71 / FR72` 外，其余上游待决事项仍维持 `open / deferred / parameterized` 身份；本轮没有把它们静默改写为默认答案。

## 对 Step 4 / authority 问题的最新理解

Step 4 中关于 UX / Architecture 的问题，后续附录已经给出更清晰的处置口径：

- 它们**不是**通过“重写 legacy UX 文档”来解决的
- 而是通过 **authority convergence** 来约束：
  - `Work Unit / Slot / Capability` 是当前唯一 2.x 默认对象模型
  - `Web 设计 → VS Code 启动 → 外部 AI 交付` 是当前唯一主链路
  - legacy UX / Architecture 继续只作 reference-only / risk-comparison

因此，**当前 authority 问题更适合视为“已收敛为护栏规则”，而不是仍需靠重写 legacy 文档来解锁**。

## 当前最准确的项目状态

### 已确认完成的

- formal inputs 已锁定
- authority order 已锁定
- Step 3 的 `42` 个 finding 已归类完成
- `W2 / V3 / O4` 过粗问题已拆解
- 保留 Story 已补最小 implementation boundary 与最小 FR trace refs
- legacy UX / Architecture 的 reference-only 身份已明确
- `FR28 / FR71 / FR72` 已完成显式采纳
- `Wave C / final verifier pass` 已完成并通过

## 当前 gate 判断

**当前 gate 判断：`PASS / READY TO UNLOCK`**

这意味着：

- `implementation-readiness` 已不再是当前 NEXT workflow；
- `sprint-planning` 已成为按顺序推进的下一个合法 workflow；
- 当前通过结论建立在 **authority 未回退、formal inputs 齐备、stable inheritance points 未失效、P0 已显式采纳、未越级冻结工程方案** 这些前提上。

## 下一步工作流

按 `workflow-status` 的顺序，下一步应进入：

1. **`sprint-planning`**
2. 后续才是 `create-story`
3. 最后才是 `dev-story`

## 已正式采纳的 P0 决策记录

> 本节内容现已作为当前 2.x `implementation-readiness` 的**显式采纳记录**生效。
> 采纳范围仅限 **guardrail / owner / visibility boundary**，用于解除 readiness 阶段的 P0 adoption blocker；**不等于**提前冻结 engineering 级方案，也不替代后续 `sprint-planning` / `create-story` / `dev-story` 的职责。

### 1. `FR28` 最小安全护栏采纳口径

**采纳决定：采用“仅提示 + 可选遮罩建议”，默认非阻断。**

理由：

- formal PRD 中对敏感信息的原始表述是：**检测潜在敏感信息并提示用户（可选遮罩）**。
- 早期产品边界也一直强调：**除空内容/全占位符外，其余校验默认非阻断**。
- 这与当前 2.x 的交付边界一致：Qomo 负责帮助用户识别风险并完成交付准备，而不是在 implementation-readiness 阶段把产品推进成更强的内容审查系统。

最小冻结方式：

- Web `W3` / VS Code `V5` 至少要能显式提示潜在敏感信息风险。
- 系统可以给出遮罩建议或一键遮罩入口。
- 用户仍可继续完成交付，不把该能力升级为硬阻断。

### 2. `FR71` 已知能力库 source-of-truth / owner 采纳口径

**采纳决定：Web 端的已知能力库只承担 design-time reference catalog 角色，runtime source-of-truth 仍归 VS Code 现场 discovery。**

理由：

- 当前 authority chain 已固定：**runtime discovery / matching / permission / compatibility 的事实源属于 VS Code**。
- 后续附录也反复强调：**Capability 设计 / 能力库 / capability discovery 不应膨胀成独立主 Epic**。
- 因此，若为 `FR71` 选择一个最小闭环，最稳妥的方式不是让 Web 能力库上位成 runtime 真相源，而是让它承担“声明辅助 / 参考词典 / continuity 载体”角色。

最小冻结方式：

- Web 可维护一份 design-time 的“已知能力参考目录”。
- 它用于帮助用户声明 capability、理解名称与分类。
- 但 runtime 是否真的可用，仍只能由 VS Code 启动时发现并判定。

### 3. `FR72` 已知能力库可见深度采纳口径

**采纳决定：当前首批只开放“声明级可见深度”，不开放完整能力治理平台深度。**

理由：

- 现有 open question 的关键不是“要不要看见能力库”，而是“**看见到什么层级**”。
- 当前 baseline 更需要的是让用户在 Web 端理解 capability 声明边界，并在 VS Code 端看到 runtime availability 摘要；并不需要在这一波里做成完整能力管理中心。
- 这也符合当前 guardrail：**不把 capability library / discovery 反客为主，挤占主链路。**

最小冻结方式：

- Web 端可见信息先停在：能力名称、类型、声明用途、与当前 `Work Unit` 的关联关系。
- 当前不冻结完整的库治理视图、版本策略、周期刷新策略、复杂 owner 模型。
- VS Code 端只负责展示 runtime availability 与问题解释，不反向要求 Web 先具备完整能力库 UI。

### 4. 采纳后的 gate 影响

本轮显式采纳完成后，当前 implementation-readiness 的剩余判断已从“P0 口径未决 + 最终复核未做”推进为：

1. `FR28` 已转为已定义的最小 guardrail。
2. `FR71/FR72` 已转为已定义的 design-time reference 口径。
3. 剩余 gate 已由本报告中的 **Wave C / final verifier pass** 完成收口。

## Wave C / 最终 verifier 预检清单（preflight）

> 用途：如果 owner 采纳上面的 P0 决策包，则可按本清单做最后一轮 readiness re-check。
> 目标不是新增方案，而是把最终判断压缩成一套**可机械核对**的 pass / fail 条件。

### A. P0 采纳确认

以下 3 项若有任一仍处于“待讨论”状态，则**不得**进入最终 pass 判断：

- [ ] `FR28` 已被明确收敛为当前 2.x 的最小安全护栏口径
- [ ] `FR71` 已被明确收敛为 design-time reference catalog 的 owner / source-of-truth 口径
- [ ] `FR72` 已被明确收敛为“声明级可见深度”的当前边界口径

### B. authority / baseline / open-question 复核

- [ ] authority order 仍保持：`spec → _bmad-output/planning-artifacts/prd.md → _bmad-output/prd-handoff-to-design.md → validated carrier → 1.x reference-only → workflow/index`
- [ ] legacy 文档仍然只被当作 `reference-only / legacy`，没有重新上位成 2.x authority
- [ ] 2.x 主对象仍然只表述为 `Work Unit / Slot / Capability`
- [ ] 主链路仍然只表述为 `Web 设计 → VS Code 启动 → 外部 AI 交付`
- [ ] runtime discovery / matching / permission / compatibility 的事实源仍归 VS Code，而不是回退给 Web / Backend
- [ ] 除已采纳的 `FR28 / FR71 / FR72` 外，其余 open questions 仍被正确保留，没有被静默冻结

### C. Wave A / Wave B / Wave B-2 继承复核

- [ ] Step 3 的 `42` 个 finding 仍全部保持已归类状态，没有重新悬空
- [ ] `deferred or future` 项没有被偷带回当前 baseline
- [ ] `W2 / V3 / O4` 的拆分结果仍保持有效，没有回退成过粗 story-family
- [ ] 依赖字段仍使用 `must-have predecessors` / `may-run-in-parallel-with` / `owner-decision inputs`
- [ ] 保留 Story 的最小 implementation boundary 仍完整存在：最小 AC、关键异常/降级、完成后可观察结果、最小 FR trace refs

### D. blocking conditions 对照核查

根据 implementation-readiness 既有规则，以下任一命中仍应直接判定 **fail**：

- [ ] 不存在 authority conflict 未消除
- [ ] 不存在 formal inputs 缺失 / 未加载 / 不可引用
- [ ] 不存在 stable inheritance points 回退
- [ ] 不存在 open questions 被当成默认答案但未显式采纳
- [ ] 不存在下游 workflow 被前拉（如 `sprint-planning` / `create-story` / `dev-story` 提前启动）
- [ ] 不存在工程级冻结被提前引入（schema / endpoint / DB / infra / code / 最终事实源拍板等）

### E. pass / fail 规则

- **可判定 pass 的最小条件**：
  1. `FR28 / FR71 / FR72` 已被显式采纳；
  2. A-D 四组检查项全部为真；
  3. verifier 能仅凭 formal inputs、validated carrier 与本报告复核通过条件；
  4. 当前输出仍未越界进入 implementation 下游内容生成。

- **仍应判定 fail 的典型情形**：
  - 任何一项 P0 仍停留在“建议候选”而非已采纳口径；
  - 虽然补了口径，但造成 authority 回退或 runtime 事实源混乱；
  - `deferred or future` 项被误写成已覆盖；
  - 为了追求 ready 而提前冻结工程方案或开始排 implementation 内容。

### F. 若通过预检，下一步允许做什么

若以上清单全部通过，则下一步才可以：

1. 进行一次最终 verifier / Wave C readiness pass 记录；
2. 在不改写 authority 的前提下，确认 `implementation-readiness` gate 是否可解除；
3. **只有在最终 pass 明确成立后**，才考虑进入 `sprint-planning`。

## Wave C / 最终 verifier 执行结果（2026-03-19）

### 最终判定

**判定结果：`PASS` / `READY TO UNLOCK`**

本轮在 `FR28 / FR71 / FR72` 已显式采纳后，重新按 A-D 条件执行 verifier 复核，结果如下。

### A-D 逐组复核结果

#### A. P0 采纳确认

- [x] `FR28` 已被显式采纳
- [x] `FR71` 已被显式采纳
- [x] `FR72` 已被显式采纳

**结论：通过。**

#### B. authority / baseline / open-question 复核

- [x] authority order 仍保持 `spec → formal PRD chain → validated carrier → reference-only → workflow/index`
- [x] legacy 文档仍未重新上位
- [x] `Work Unit / Slot / Capability` 与 `Web 设计 → VS Code 启动 → 外部 AI 交付` 主链路未回退
- [x] runtime discovery / matching / permission / compatibility 的事实源仍归 VS Code
- [x] 除 `FR28 / FR71 / FR72` 外，其余 open questions 仍保持显式 open / deferred / parameterized

**结论：通过。**

#### C. Wave A / Wave B / Wave B-2 继承复核

- [x] `42` 个 Step 3 finding 仍保持已 disposition
- [x] `deferred or future` 项未被偷带回当前 baseline
- [x] `W2 / V3 / O4` 的拆分与依赖语义仍保持有效
- [x] 保留 Story 的最小 implementation boundary / FR trace refs 仍可引用

**结论：通过。**

#### D. blocking conditions 对照核查

- [x] 未发现 authority conflict 未消除
- [x] 未发现 formal inputs 缺失 / 不可引用
- [x] 未发现 stable inheritance points 回退
- [x] 未发现 open questions 被当成默认答案但未显式采纳
- [x] 未发现下游 workflow 被前拉
- [x] 未发现工程级冻结被提前引入

**结论：通过。**

### 最终正式输出

1. **`implementation-readiness` gate 现可解除。**
2. `docs/project-planning-artifacts/implementation-readiness-report-2026-03-19.md` 现作为本轮 solutioning 阶段的完成载体。
3. `workflow-status` 中 `implementation-readiness` 应更新为本报告路径。
4. **下一个合法 workflow 是 `sprint-planning`。**

### 通过结论的适用边界

本次 `PASS` 仅表示：

- readiness 阶段要求的 authority / baseline / blocker / verifier 条件已满足；
- 可以进入下一阶段的排期与实施规划。

本次 `PASS` **不表示**：

- 已完成 `sprint-planning`
- 已完成 `create-story`
- 已完成 `dev-story`
- 已提前冻结 schema / API / DB / infra / code 等 engineering 级细节
