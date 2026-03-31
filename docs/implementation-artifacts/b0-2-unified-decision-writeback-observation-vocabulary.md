# Story B0.2: 统一决策回写与观测最小词汇表

Status: done

## Story

作为一个在 **VS Code 启动台做出启动决策、交付结果、回写摘要、观测事件** 的 Qomo 用户，
我希望系统在 `LaunchDecision`、最小回写摘要、观测事件三个层面使用**同一组 result / action / outcome 分层词汇**，
从而让产品能准确区分"决策结论"、"交付后事实"、"观测摘要"，而不会把回写失败伪装成决策成功，也不会把观测缺失伪装成已验证。

## Acceptance Criteria

1. **共享词汇基线**
   - Given `V4`（用户决策）、`V5`（结构化交付）、`O1-O4`（观测闭环）都需要消费决策 / 回写 / 观测语义，
   - When 开发者实现本故事，
   - Then 代码库中必须存在一套共享的前端域类型，至少包含：
     - `LaunchDecision`：启动决策结果（继续 / 取消 / 降级 / 替代）
     - 最小回写摘要结构：版本引用、decision 摘要、关键问题摘要、交付结果
     - 观测事件分层词汇：区分 decision outcome、handoff outcome、writeback outcome、observation outcome

2. **result / action / outcome 三层强制分离**
   - Given B0-3 验收约束要求分层不可混写，
   - When 任何后续 Story 消费本词汇表，
   - Then 以下必须作为**独立 outcome 层**，不得混入 `LaunchDecision.resultType`：
     - `手动补充`、`返回修订`、`retry`
     - `handoff_failure`、`writeback_failure`、`observation_failure`
   - And `LaunchDecision.resultType` 只允许：`continue` / `cancel` / `degrade` / `substitute`

3. **失败场景独立 outcome**
   - Given 交付失败、回写失败、观测失败都是真实发生的事件，
   - When 这些事件发生时，
   - Then 必须保留为独立 outcome 记录，不得伪装成成功 decision 或静默丢弃
   - And 回写失败必须留下失败 outcome 或本地残留摘要，不得把"未写回"伪装成"已观测"

4. **跨工作面复用同一词汇**
   - Given `V3a/b/c`、`V4`、`V5`、`O1-O4` 都依赖本词汇表，
   - When 后续 Story 使用决策 / 回写 / 观测语义，
   - Then 必须复用本故事建立的共享 contract，而不是各自定义局部词汇

5. **不越权冻结工程级方案**
   - Given 当前 authority 与 implementation-readiness 已明确 guardrails，
   - When 实现本故事，
   - Then 只允许收敛前端共享词汇与本地 contract，不得提前冻结 backend schema、OpenAPI、endpoint、DB、infra、最终事实源策略
   - And 不得把本故事膨胀成 capability discovery、执行平台、或完整观测数据平台

6. **当前仓库可验证该词汇**
   - Given 当前仓库已有 B0.1 的 `WorkUnitSnapshot` 三层身份语义，
   - When 本故事完成，
   - Then 至少应存在一个最小可见的演示/检查入口，能展示 `LaunchDecision`、最小回写摘要、观测事件的分层结构
   - And 演示可复用 B0.1 的 `WorkUnitSnapshot` 作为上下文输入

## Tasks / Subtasks

- [x] **任务 1：定义 LaunchDecision 共享类型** (AC: 1, 2, 4)
  - [x] 在 `src/types/` 下新增 `decision.types.ts`，定义 `LaunchDecision` 及其 `resultType` 枚举（`continue` / `cancel` / `degrade` / `substitute`）
  - [x] 定义 `DecisionContext`：承载决策时的上下文（能力可用性摘要、问题列表、降级/替代选项）
  - [x] 定义 `DecisionOutcome`：承载决策后的实际结果，与 `resultType` 分离
  - [x] 更新 `src/types/index.ts` barrel export

- [x] **任务 2：定义最小回写摘要共享类型** (AC: 1, 3, 4)
  - [x] 在 `src/types/` 下新增 `writeback.types.ts`，定义 `MinimalWritebackSummary` 结构
  - [x] 必须包含：版本引用（复用 B0.1 的 `SnapshotIdentity` 引用）、decision 摘要、关键问题摘要、交付结果
  - [x] 定义 `WritebackOutcome`：成功 / 失败 / 部分写回，与 decision outcome 独立
  - [x] 更新 `src/types/index.ts` barrel export

- [x] **任务 3：定义观测事件分层词汇** (AC: 1, 2, 3, 4)
  - [x] 在 `src/types/` 下新增 `observation.types.ts`，定义观测事件的分层词汇表
  - [x] 至少区分四层事件类型：`decision_event` / `handoff_event` / `writeback_event` / `observation_event`
  - [x] 定义 `ObservationOutcome`：独立于 decision，记录观测本身的成功/失败
  - [x] 确保 `handoff_failure`、`writeback_failure`、`observation_failure` 作为独立 outcome 存在
  - [x] 更新 `src/types/index.ts` barrel export

- [x] **任务 4：补齐最小语义辅助函数** (AC: 1, 2, 3)
  - [x] 在 `src/utils/` 中新增 `decisionHelper.ts`，提供创建 `LaunchDecision`、`MinimalWritebackSummary`、观测事件的 helper
  - [x] helper 只处理前端域语义，不引入 backend / persistence / API 假设
  - [x] 确保 helper 强制执行 result / action / outcome 分离（类型层面不允许混写）
  - [x] 更新 `src/utils/index.ts` barrel export

- [x] **任务 5：演示入口** (AC: 5, 6)
  - [x] 新增一个最小演示组件，展示 `LaunchDecision`、`MinimalWritebackSummary`、观测事件的分层结构
  - [x] 演示至少覆盖：一次正常启动决策 + 回写摘要、一次交付失败的独立 outcome、一次回写失败的独立 outcome
  - [x] 复用 B0.1 的 `WorkUnitSnapshot` 作为演示上下文
  - [x] 更新 `App.tsx` 集成新演示入口（与 B0.1 演示共存或切换展示）

- [x] **任务 6：完成最小验证与质量门槛** (AC: 1-6)
  - [x] 为新增类型和 helper 补齐 Vitest 测试，重点覆盖：
    - result / action / outcome 分层不可混写
    - 失败场景产生独立 outcome
    - helper 正确创建各类结构
  - [x] 确保 `npm run lint`、`npm run build`、`npm test` 全部通过
  - [x] 在故事记录中列出新增/修改文件

## Dev Notes

### Developer Context

- 这是 backbone 中的第二张 foundation story，紧接 B0.1。
- B0.1 已建立 `WorkUnitSnapshot` 三层身份语义（identity / version / lineage），本故事在此基础上新增 **decision / writeback / observation 分层词汇**。
- 当前代码库已有：
  - `src/types/workUnit.types.ts` — B0.1 建立的 11 个类型
  - `src/utils/workUnitSnapshotHelper.ts` — 8 个 helper 函数
  - `src/components/WorkUnitSnapshotIdentityCard/` — B0.1 演示组件
  - `tests/` — 23 个测试（Vitest + @testing-library/react）
- 本故事**不替代** B0.1 的任何内容，只新增 decision / writeback / observation 层。

### Technical Requirements

- 本故事的核心输出是三组共享类型 + helper，服务于以下后续 Story：
  - `V3a/b/c`：capability 判断（消费 decision 词汇）
  - `V4`：用户决策与降级路径（消费 `LaunchDecision`）
  - `V5`：结构化交付与 fallback（消费 handoff outcome）
  - `O1`：启动最小回写摘要（消费 `MinimalWritebackSummary`）
  - `O2`：返回 Web 修订连续性（消费 writeback 中的问题指向）
  - `O3`：历史回看与再次启动线索（消费 decision + writeback 摘要）
  - `O4a/b/c`：MVP 价值验证观测切片（消费观测事件分层）
- `LaunchDecision.resultType` **只允许四值**：`continue` / `cancel` / `degrade` / `substitute`
  - 所有用户后续动作（手动补充、返回修订、retry）和系统事件（handoff_failure、writeback_failure、observation_failure）必须在 **action / outcome 层** 独立表达
- 观测事件必须区分至少四个层：
  - `decision_event`：决策本身的结果
  - `handoff_event`：交付动作的结果
  - `writeback_event`：回写动作的结果
  - `observation_event`：观测/验证动作的结果
- 回写摘要（`MinimalWritebackSummary`）必须引用 B0.1 的 `SnapshotIdentity`，保持身份引用一致性

### Architecture Compliance

- 继续保持 B0.1 的 authority order：`spec → formal PRD chain → validated carrier → reference-only`
- 本故事新增的类型放在 `src/types/`，helper 放在 `src/utils/`，演示组件放在 `src/components/`
- 分层硬约束：组件不直连 service/DB，utils 为纯函数
- 继续保持双端职责边界：
  - Web：design-time 声明与治理
  - VS Code：runtime discovery / matching / decision
  - 本故事定义的词汇表是**前端共享 contract**，不冻结 backend 实现
- 不引入以下越权内容：
  - backend schema、OpenAPI、endpoint、DB、infra
  - capability discovery 具体实现
  - 完整观测数据平台 / 报表 / 统计

### Library / Framework Requirements

- 继续沿用 B0.1 已安装的技术栈：
  - `react` ^18.3.1, `typescript` ^5.5.3, `vite` ^6.3.0
  - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- 不需要引入新依赖
- 如测试需要额外 matcher，确认 `@testing-library/jest-dom` 已覆盖

### File Structure Requirements

- 推荐的最小文件方向：
  - `src/types/decision.types.ts` — LaunchDecision 及相关类型
  - `src/types/writeback.types.ts` — MinimalWritebackSummary 及相关类型
  - `src/types/observation.types.ts` — 观测事件分层词汇
  - `src/types/index.ts` — 更新 barrel export
  - `src/utils/decisionHelper.ts` — decision / writeback / observation helper
  - `src/utils/index.ts` — 更新 barrel export
  - `src/components/DecisionWritebackDemo/DecisionWritebackDemo.tsx` — 演示组件
  - `src/components/DecisionWritebackDemo/index.ts` — barrel export
  - `src/components/App/App.tsx` — 更新集成演示
  - `tests/decision.types.test.ts` — 类型 contract 验证
  - `tests/decisionHelper.test.ts` — helper 函数测试
  - `tests/decisionWritebackDemo.test.tsx` — 组件渲染测试

### Testing Requirements

- 复用 B0.1 引入的 Vitest + @testing-library/react 测试基础设施
- 测试重点：
  - **类型安全**：确认 `resultType` 只接受四值，不允许混入 action/outcome
  - **分层分离**：确认 handoff_failure / writeback_failure / observation_failure 作为独立 outcome 存在
  - **helper 正确性**：各 helper 产生的结构符合分层约束
  - **演示组件**：正确渲染正常 / 失败各场景
- 交付前必须通过：`npm run lint`、`npm run build`、`npm test`

### Previous Story Intelligence

- **B0.1 学到的模式（必须沿用）**：
  - 类型定义在 `src/types/` 下单独文件，通过 barrel export
  - helper 在 `src/utils/` 下，纯函数，不依赖外部状态
  - 演示组件在独立文件夹，通过 barrel export
  - ID 生成使用 `crypto.randomUUID()` 优先 + 降级方案
  - 时间戳统一使用 `ISO8601` 类型别名
- **B0.1 code review 修复要点**：
  - `generateId` 使用 `crypto.randomUUID()`，降级兜底用 `padEnd`
  - `formatTime` 使用 `isNaN` 检测无效日期，不依赖异常捕获
  - React list key 使用 composite key，不用数组 index
  - 演示数据放在 `useMemo` 中，不在模块顶层
  - 构建参数类型移入 `src/types/`，符合目录约定

### Project Structure Notes

- 新增文件均遵循 `docs/mault.yaml` 命名规范
- 类型文件：`*.types.ts`
- 工具函数：`*Helper.ts`
- 组件：`*Component.tsx` 或 PascalCase 目录 + 同名文件
- 测试：`tests/*.test.ts(x)`

### References

- `docs/analysis/product-brief-Qomo-2025-12-27.md` — B0-2 定义（第 3043 行）、Wave B 拆分、最小实现边界（第 3578 行）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — `LaunchDecision` / `HandoffPayload` 核心契约（第 1333-1334 行）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — result / action / outcome 分离硬约束（第 3189、3332 行）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — O1-O4 story 定义（第 3601-3604 行）
- `_bmad-output/planning-artifacts/prd.md` — FR56-FR61（观测与分析）、FR83-FR85（能力降级与观测）
- `docs/project-planning-artifacts/implementation-readiness-report-2026-03-19.md` — authority order、guardrails
- `docs/implementation-artifacts/b0-1-unified-object-identity-version-lineage-references.md` — B0.1 完成记录与文件清单
- `CLAUDE.md` — 仓库结构、文件位置、测试与命名规范

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 修复 lint 错误：移除 `decisionHelper.ts` 中未使用的 `DecisionContext` import

### Completion Notes List

- ✅ 任务 1：定义了 `DecisionResultType`（四值）、`CapabilityIssue`、`FallbackOption`、`DecisionContext`、`LaunchDecision` 共 5 个类型。
- ✅ 任务 2：定义了 `WritebackOutcome`、`HandoffResult`、`KeyIssueSummary`、`MinimalWritebackSummary` 等 6 个类型。回写结果独立于决策结果。
- ✅ 任务 3：定义了四层事件类型（`DecisionEvent`、`HandoffEvent`、`WritebackEvent`、`ObservationEvent`）+ `BaseObservationEvent` + `AnyObservationEvent` 联合类型 + `ObservationOutcome`。
- ✅ 任务 4：实现了 7 个 helper 函数（`createLaunchDecision`、`createWritebackSummary`、`createFailedWriteback`、`createDecisionEvent`、`createHandoffEvent`、`createWritebackEvent`、`createObservationEvent`）。
- ✅ 任务 5：新增 `DecisionWritebackDemo` 组件，展示三个场景（正常/交付失败/回写失败）。更新 `App.tsx` 为 tab 切换式演示（B0.1 + B0.2）。
- ✅ 任务 6：新增 27 个测试（类型 contract 15 个 + helper 12 个 + 组件 4 个），全部 50 个测试通过，lint 和 build 通过。

### File List

- `src/types/decision.types.ts` — 新增：LaunchDecision 及相关决策类型
- `src/types/writeback.types.ts` — 新增：MinimalWritebackSummary 及回写类型
- `src/types/observation.types.ts` — 新增：四层观测事件分层词汇
- `src/types/index.ts` — 修改：新增三个类型文件的 barrel export
- `src/utils/decisionHelper.ts` — 新增：decision / writeback / observation helper 函数
- `src/utils/index.ts` — 修改：新增 helper 的 barrel export
- `src/components/DecisionWritebackDemo/DecisionWritebackDemo.tsx` — 新增：分层演示组件
- `src/components/DecisionWritebackDemo/index.ts` — 新增：barrel export
- `src/components/index.ts` — 修改：新增 DecisionWritebackDemo export
- `src/components/App/App.tsx` — 修改：tab 切换式演示（B0.1 + B0.2）
- `tests/decision.types.test.ts` — 新增：类型 contract 验证（15 个测试）
- `tests/decisionHelper.test.ts` — 新增：helper 函数测试（12 个测试）
- `tests/decisionWritebackDemo.test.tsx` — 新增：演示组件渲染测试（4 个测试）
- `docs/implementation-artifacts/b0-2-unified-decision-writeback-observation-vocabulary.md` — 修改：本文件

## Change Log

- 2026-03-31: B0.2 Story 完成实现。建立 decision / writeback / observation 三层分离词汇表（3 个类型文件 + 1 个 helper 文件 + 1 个演示组件）。50 个测试通过，lint 和 build 通过。
