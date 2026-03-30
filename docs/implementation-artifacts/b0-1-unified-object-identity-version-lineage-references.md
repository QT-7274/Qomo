# Story B0.1: 统一对象身份、版本与谱系引用语义

Status: review

## Story

作为一个在 **Web 设计台、VS Code 启动台、1.x 迁移链路** 之间来回工作的 Qomo 用户，
我希望系统始终引用**同一个可追溯的 `WorkUnitSnapshot` 对象语义**，并清楚区分**逻辑身份、快照/版本身份、来源/谱系引用**，
从而让我能信任跨端连续性、理解对象来源，并避免不同工作面各自发明一套对象解释。

## Acceptance Criteria

1. **共享身份语义基线**
   - Given 当前 Web / VS Code / migration / observation 都会消费同一个 `Work Unit`，
   - When 开发者实现本故事，
   - Then 代码库中必须存在一套共享的前端域模型，用来明确区分：
     - 稳定的逻辑对象身份
     - 某个可启动快照的版本/快照身份
     - 来源、父版本、迁移来源等谱系引用

2. **跨工作面复用同一语义**
   - Given 后续 `W4`、`V1`、`M3`、`O1` 都依赖这个基础故事，
   - When 它们消费对象引用，
   - Then 它们必须复用本故事建立的共享 contract，而不是各自定义一套局部 id / version / lineage 字段。

3. **迁移与复制场景可追溯**
   - Given 一个 `Work Unit` 可能来自复制、历史版本恢复或 `1.x → 2.x` 迁移，
   - When 系统表示该对象来源，
   - Then 必须能表达 source ↔ target、父版本、迁移记录等引用关系，且**不把 migration success 误写成 runtime success**。

4. **不越权冻结工程级方案**
   - Given 当前 authority 与 implementation-readiness 已明确 guardrails，
   - When 实现本故事，
   - Then 只允许收敛前端共享语义与本地 contract，不得提前冻结 backend schema、OpenAPI、endpoint、DB、infra、最终事实源策略。

5. **保持双端职责边界**
   - Given Web 负责 design-time 声明与治理、VS Code 负责 runtime discovery / matching / decision，
   - When 实现本故事，
   - Then 不得把 runtime 权威回退给 Web，也不得让本故事膨胀成 capability discovery 或执行平台故事。

6. **当前仓库可验证该语义**
   - Given 当前仓库还是 Vite React 初始骨架，
   - When 本故事完成，
   - Then 至少应存在一个最小可见的演示/检查入口，能展示同一个 `WorkUnitSnapshot` 的身份、版本与谱系引用结构，证明语义在当前 Web 端已经可被消费。

## Tasks / Subtasks

- [x] **任务 1：建立共享对象身份 contract** (AC: 1, 2, 3)
  - [x] 在 `src/types/` 下新增面向 `WorkUnitSnapshot` 的共享类型文件，定义逻辑身份、快照身份、版本引用、谱系引用、迁移来源引用等基础结构
  - [x] 更新 `src/types/index.ts`，对外导出这些共享类型
  - [x] 命名必须直接服务后续 `W4 / V1 / M3 / O1` 复用，避免出现同义重复字段

- [x] **任务 2：补齐最小语义辅助函数** (AC: 1, 2, 3)
  - [x] 在 `src/utils/` 中新增快照/版本/谱系相关 helper，用于创建、归一化或格式化引用信息
  - [x] helper 只处理前端域语义，不引入 backend / persistence / API 假设
  - [x] 明确支持复制、历史恢复、迁移来源这三类谱系表达

- [x] **任务 3：把当前 Web 骨架替换成 B0.1 演示入口** (AC: 5, 6)
  - [x] 用一个最小领域演示替换当前 Vite 默认计数器页面，让页面展示 `WorkUnitSnapshot` 的 identity / version / lineage 结构
  - [x] 演示内容至少覆盖：稳定对象身份、当前快照版本、来源关系、迁移/复制/父版本中的至少一种
  - [x] 页面表达只用于验证共享语义已经落地，不扩展成完整设计台 UI

- [x] **任务 4：把实现边界写死在代码与说明中** (AC: 4, 5)
  - [x] 在实现处明确注释或命名边界：本故事只处理 shared contract，不处理 runtime availability、decision、handoff、backend schema
  - [x] 确保没有引入与 authority chain 冲突的字段命名或职责划分

- [x] **任务 5：完成最小验证与质量门槛** (AC: 1-6)
  - [x] 为新增 helper 和最小 UI 演示补齐可执行验证（若需新增测试基础设施，范围仅限支撑本故事）
  - [x] 确保 `npm run lint` 与 `npm run build` 通过
  - [x] 在故事记录中列出新增/修改文件，便于后续 `W4 / V1 / M3 / O1` 继承

## Dev Notes

### Developer Context

- 这是当前 `create-story` 顺序中的**第一张 backlog story**，也是推荐排序中的首个 foundation story。
- 当前代码库仍接近 Vite React 初始骨架：
  - `src/components/App/App.tsx` 仍是默认计数器页面
  - `src/types/index.ts`、`src/utils/index.ts` 目前还是占位文件
- 这意味着本故事的目标不是“接现有复杂系统”，而是**为后续所有跨端语义建立第一层可复用 contract**。

### Technical Requirements

- `B0-1` 必须服务于以下后续对象，而不是停留在抽象命名：
  - `W4`：版本化快照与继续编辑连续性
  - `V1`：启动入口与对象选择
  - `M3`：迁移落地与迁移记实
  - `O1`：启动最小回写摘要
- 必须清晰区分至少三层：
  - **逻辑身份**：同一个 `Work Unit` 在长期演进中的稳定 identity
  - **快照/版本身份**：某次可启动、可回看的具体 revision
  - **谱系引用**：父版本、复制来源、迁移来源、source ↔ target 追踪
- `MigrationRecord` / `MigrationPreview` 的来源关系可以被表达，但**绝不能**暗示“迁移完成 = runtime 可用”。
- 当前故事只定义共享 contract，不做：
  - capability availability
  - launch decision
  - handoff payload
  - backend persistence contract

### Architecture Compliance

- 当前 authority order 必须继续保持：`spec → formal PRD chain → validated carrier → reference-only → workflow/index`
- 本故事必须继承的稳定对象骨架包括：
  - `WorkUnitSnapshot`
  - `LaunchContextEnvelope`
  - `CapabilityAvailability`
  - `LaunchDecision`
  - `HandoffPayload`
  - `MigrationPreview / MigrationRecord`
- 但本故事当前只允许真正落地 **`WorkUnitSnapshot` 相关 identity / version / lineage 语义**。
- 必须保持双端职责边界：
  - Web：design-time 声明与治理
  - VS Code：runtime discovery / matching / decision
  - Backend：共享资产、目录、身份与观测平面
- 不得引入以下越权内容：
  - backend schema、OpenAPI、endpoint naming、DB、infra、最终事实源拍板
  - capability discovery 具体实现
  - 把外部 AI 执行回收为产品内闭环

### Library / Framework Requirements

- 当前工作区已安装并应优先沿用：
  - `react` `^18.3.1`
  - `react-dom` `^18.3.1`
  - `vite` `^6.3.0`
  - `typescript` `^5.5.3`
  - `eslint` `^9.9.0`
- 不要为了本故事引入状态管理库、后端 SDK 或数据库层。
- 如果为测试引入新依赖，范围必须最小，并同步更新 `package.json` script 与项目说明。

### File Structure Requirements

- 按仓库约定落位：
  - 共享类型：`src/types/`
  - 工具/helper：`src/utils/`
  - UI 组件：`src/components/`
  - 若新增 hooks：`src/hooks/`
  - 若新增测试：`tests/`
- 推荐的最小文件方向：
  - `src/types/workUnit.types.ts`
  - `src/utils/workUnitSnapshotHelper.ts`
  - `src/components/WorkUnitSnapshotIdentityCard.tsx`
  - 更新 `src/components/App/App.tsx`
  - 视需要更新 `src/components/index.ts` 与对应样式文件

### Testing Requirements

- 当前项目**尚未配置测试框架**；如要补测试，请把新增基础设施限制在支撑本故事所需的最小范围。
- 最少要覆盖：
  - 快照 identity / version / lineage helper 的归一化与派生结果
  - 演示组件对样例 `WorkUnitSnapshot` 的正确渲染
- 无论是否新增测试框架，交付前都必须至少通过：
  - `npm run lint`
  - `npm run build`

### Previous Story Intelligence

- 不适用：这是当前 sprint 基线中的第一张 story，暂无上一张 story 可继承。

### Project Context Reference

- 未发现 `project-context.md`。
- 项目结构与命名约束以 `AGENTS.md` 为准。

### References

- `docs/analysis/product-brief-Qomo-2025-12-27.md` — `create-epics-and-stories Wave 2` / `Wave 3` / `Wave B`
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — `B0-1 统一对象身份 / 版本 / 谱系引用语义`
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — `WorkUnitSnapshot` / `MigrationPreview` / `MigrationRecord` / 双端责任边界
- `_bmad-output/planning-artifacts/prd.md` — `FR6`、`FR7`、`FR44`、`FR45`、`FR47`、`NFR41`、`NFR42`
- `docs/project-planning-artifacts/implementation-readiness-report-2026-03-19.md` — authority order、guardrails、不得提前冻结工程级方案
- `AGENTS.md` — 仓库结构、文件位置、测试与命名规范
- `package.json` — 当前技术栈版本

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- 首次 create-story 目标采用显式指定路径处理：当前 `sprint-status.yaml` 使用 `b0-1 / w1 / v1` 风格 key，而不是默认 `1-2-xxx` 数字格式。

### Completion Notes List

- 本故事文件由 `create-story` 工作流生成。
- 目标 story：`b0-1-unified-object-identity-version-lineage-references`
- ✅ 任务 1：建立了 `WorkUnitIdentity`、`SnapshotIdentity`、`LineageReference`、`MigrationSourceReference`、`WorkUnitSnapshot` 等 11 个类型/类型别名，三层身份语义完整覆盖。
- ✅ 任务 2：实现了 8 个 helper 函数（`createWorkUnitIdentity`、`createSnapshotIdentity`、`createFreshLineage`、`createCloneLineage`、`createMigrationLineage`、`createRestoredLineage`、`buildWorkUnitSnapshot`、`formatSnapshotId`），覆盖全新创建、克隆、迁移、历史恢复四种场景。
- ✅ 任务 3：替换 Vite 默认计数器为 B0.1 演示页面，展示三种场景（全新/克隆/迁移）的 `WorkUnitSnapshot` 身份卡片。
- ✅ 任务 4：在 `workUnit.types.ts` 和 `workUnitSnapshotHelper.ts` 中写入显式边界声明注释。
- ✅ 任务 5：引入 Vitest + @testing-library/react，23 个测试全部通过，lint 和 build 均通过。
- 新增测试基础设施：`vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom`，`package.json` 新增 `test` / `test:watch` script。

### File List

- `src/types/workUnit.types.ts` — 新增：三层身份语义共享类型定义
- `src/types/index.ts` — 修改：barrel export
- `src/utils/workUnitSnapshotHelper.ts` — 新增：identity/version/lineage helper 函数
- `src/utils/index.ts` — 修改：barrel export
- `src/components/WorkUnitSnapshotIdentityCard/WorkUnitSnapshotIdentityCard.tsx` — 新增：演示组件
- `src/components/WorkUnitSnapshotIdentityCard/index.ts` — 新增：barrel export
- `src/components/index.ts` — 修改：barrel export
- `src/components/App/App.tsx` — 修改：替换为 B0.1 演示入口
- `tests/workUnit.types.test.ts` — 新增：类型 contract 验证测试（8 个）
- `tests/workUnitSnapshotHelper.test.ts` — 新增：helper 函数测试（12 个）
- `tests/workUnitSnapshotIdentityCard.test.tsx` — 新增：组件渲染测试（3 个）
- `vite.config.ts` — 修改：添加 vitest 测试配置
- `package.json` — 修改：新增 test script 和测试依赖
- `docs/implementation-artifacts/b0-1-unified-object-identity-version-lineage-references.md` — 修改：本文件

## Change Log

- 2026-03-30: B0.1 Story 完成实现。建立 WorkUnitSnapshot 三层身份语义 contract（types + helpers + demo UI + tests）。引入 Vitest 测试框架。23 个测试通过，lint 和 build 通过。
