# Story W2a: Work Unit 核心结构声明

Status: done

## Story

作为一个在 Web 设计台中定义 AI 工作方式的 Qomo 用户，
我希望能为 `Work Unit` 添加结构化的 `Slot` 和 `Capability`，把方法沉淀为稳定的结构骨架，
从而让我的 Prompt 不再是散落文本，而是可组合、可复用、可继续治理的结构化对象。

## Acceptance Criteria

1. **创建 Work Unit 带初始结构**
   - Given 用户在 Web 设计台中，
   - When 创建新 Work Unit，
   - Then 可以指定名称、描述，系统创建一个带空 Slot 列表的结构化对象（FR1）。

2. **编辑 Work Unit 基本信息**
   - Given 一个已有的 Work Unit，
   - When 用户编辑名称或描述，
   - Then 修改立即持久化到 IndexedDB，updatedAt 刷新（FR2）。

3. **添加 Slot**
   - Given 用户在 Work Unit 详情页，
   - When 添加一个 Slot，
   - Then 需指定名称、类型、描述、是否必需，Slot 出现在该 Work Unit 的 Slot 列表中（FR8）。

4. **编辑和删除 Slot**
   - Given 一个已有的 Slot，
   - When 用户编辑属性或删除该 Slot，
   - Then 编辑立即生效；删除需确认，且 Slot 下无 Capability 时方可删除（FR9、FR10）。

5. **为 Slot 添加 Capability**
   - Given 一个已有的 Slot，
   - When 用户为其添加 Capability，
   - Then 需指定名称和内容（文本），Capability 出现在该 Slot 的 Capability 列表中（FR11）。

6. **编辑、删除、排序 Capability**
   - Given 一个已有的 Capability，
   - When 用户编辑内容、删除或调整顺序，
   - Then 操作立即生效并持久化（FR12、FR13、FR14）。

7. **复制 Work Unit**
   - Given 一个已有的 Work Unit，
   - When 用户执行复制操作，
   - Then 创建一个带 `cloned_from` 谱系的新 Work Unit，包含相同的 Slot/Capability 结构（FR4）。

8. **结构可被后续 Story 消费**
   - Given W2b/W2c/W3/W4 都依赖 W2a 建立的结构，
   - When 后续 Story 读取 Work Unit，
   - Then Slot/Capability 结构已稳定且可被扩展（不锁死后续字段）。

## Tasks / Subtasks

- [ ] **任务 1：定义 Slot 与 Capability 共享类型** (AC: 3, 5, 8)
  - [ ] 在 `src/types/` 新增 `slot.types.ts`，定义 `Slot`（id, name, type, description, required, capabilities）和 `SlotType` 枚举
  - [ ] 在 `src/types/` 新增 `capability.types.ts`，定义 `Capability`（id, name, content, order）
  - [ ] 更新 `src/types/index.ts` barrel export
  - [ ] 类型设计需预留 W2b（约束/输出语义）和 W2c（待补齐项）扩展空间

- [ ] **任务 2：扩展 StorageService 的 Work Unit schema** (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] 升级 Dexie schema 到 version(2)，`WorkUnitRecord` 新增 `description`、`slots` 字段
  - [ ] `slots` 为嵌套 JSON（Slot 数组，每个 Slot 包含 Capability 数组）
  - [ ] 新增 Slot CRUD 方法：`addSlot()`、`updateSlot()`、`deleteSlot()`
  - [ ] 新增 Capability CRUD 方法：`addCapability()`、`updateCapability()`、`deleteCapability()`、`reorderCapabilities()`
  - [ ] 新增 `cloneWorkUnit()` 方法（复制结构 + 设置 `cloned_from` 谱系）
  - [ ] 新增 `updateWorkUnitInfo()` 方法（编辑名称、描述）
  - [ ] 所有写入在 Dexie 事务内完成

- [ ] **任务 3：建立 Work Unit 编辑器组件** (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 重构 `WorkUnitDetailComponent` 为完整编辑器（当前是占位页面）
  - [ ] 支持编辑名称和描述（内联编辑或表单）
  - [ ] 展示 Slot 列表，每个 Slot 展示名称、类型、必需标记
  - [ ] 每个 Slot 下展示 Capability 列表，每个 Capability 展示名称和内容摘要
  - [ ] 添加/编辑/删除 Slot 的交互入口
  - [ ] 添加/编辑/删除/排序 Capability 的交互入口

- [ ] **任务 4：实现 Slot 管理交互** (AC: 3, 4)
  - [ ] 添加 Slot 表单：名称、类型（下拉选择）、描述、是否必需（复选框）
  - [ ] 编辑 Slot：点击后可修改属性
  - [ ] 删除 Slot：确认后删除，但仅当该 Slot 无 Capability 时允许

- [ ] **任务 5：实现 Capability 管理交互** (AC: 5, 6)
  - [ ] 添加 Capability 表单：名称、内容（文本区域）
  - [ ] 编辑 Capability：点击后可修改
  - [ ] 删除 Capability：确认后删除
  - [ ] 排序 Capability：上移/下移按钮调整顺序

- [ ] **任务 6：实现 Work Unit 复制** (AC: 7)
  - [ ] 在列表页或详情页添加"复制"入口
  - [ ] 调用 `cloneWorkUnit()` 创建副本
  - [ ] 新副本名称加"（副本）"后缀
  - [ ] 复制后导航到新 Work Unit 详情

- [ ] **任务 7：扩展 useWorkUnits hook** (AC: 1-7)
  - [ ] 新增 `useWorkUnitEditor` hook，封装单个 Work Unit 的编辑操作
  - [ ] 包含：加载 Work Unit、编辑信息、Slot CRUD、Capability CRUD、复制
  - [ ] 组件层通过 hook 消费，不直接调用 Service

- [ ] **任务 8：测试与质量门槛** (AC: 1-8)
  - [ ] StorageService 扩展方法测试（Slot/Capability CRUD、clone、schema 升级）
  - [ ] 组件渲染测试（编辑器、Slot 管理、Capability 管理）
  - [ ] 确保 `npm run lint`、`npm run build`、`npm test` 全部通过
  - [ ] W1 的 73 个已有测试不能回归

## Dev Notes

### Developer Context

- 这是 Epic 1 的第二个 story，紧接 W1。W2a 与 W1 `may-run-in-parallel-with`，都只依赖 B0-1。
- W1 已建立：
  - `StorageService` + Dexie `workUnits` 表（id, name, sourceType, createdAt, updatedAt）
  - React Router（`/` → 列表，`/work-unit/:id` → 详情占位）
  - `useWorkUnits` hook（列表 CRUD）
  - `WorkUnitListComponent`（搜索/排序/删除/空状态）
  - `WorkUnitDetailComponent`（当前只是占位页面，显示基本 metadata）
- W2a 的核心任务是**把占位详情页升级为结构化编辑器**，并在类型和持久化层引入 Slot/Capability。
- W2b（约束/输出语义）和 W2c（待补齐项语义）都依赖 W2a，所以类型设计需预留扩展字段。

### Technical Requirements

- **Slot 类型设计**：
  - `SlotType` 至少包含：`context`（上下文）、`rule`（规则/约束）、`output`（输出要求）、`capability`（能力挂载）、`custom`（自定义）
  - 每个 Slot 有 `id`、`name`、`slotType`、`description`、`required`（布尔）、`capabilities`（Capability 数组）
  - Slot 对外术语仍 open（参数化约束），内部使用 `Slot`
- **Capability 类型设计**：
  - 每个 Capability 有 `id`、`name`、`content`（文本）、`order`（排序序号）
  - W2a 不涉及 `Capability Requirement` 的声明（那是 FR77，由 W3/V3 消费）
  - Capability 可见深度仍 open（参数化约束）
- **Dexie schema 升级**：
  - 从 version(1) 升级到 version(2)
  - `slots` 作为嵌套 JSON 存储在 `WorkUnitRecord` 中（Dexie 支持非索引嵌套字段）
  - 不为 Slot/Capability 建独立表（当前数据量小，嵌套更简单）
- **复制功能**：复用 B0.1 的 `createCloneLineage` 建立谱系。新 Work Unit 的 `sourceType` 设为 `cloned_from`。

### Architecture Compliance

- 分层硬约束继续执行：`Component → Hook → Service → Dexie`
- 所有持久化操作必须走 `StorageService`，在 Dexie 事务内完成
- 类型在 `src/types/` 下，helper 在 `src/utils/`，组件在 `src/components/`
- 命名遵循 `docs/mault.yaml`：`*Component.tsx`、`use*.ts`、`*Service.ts`、`*.types.ts`

### Library / Framework Requirements

- 沿用 W1 已安装的：`react` ^18.3.1、`dexie`、`react-router-dom`、`vitest`、`fake-indexeddb`
- **不引入新依赖**。排序可用 CSS/内联按钮实现，不需要 drag-and-drop 库。
- 表单可用原生 HTML 元素。后续引入 shadcn/ui 时再升级。

### File Structure Requirements

- 新增/修改文件方向：
  - `src/types/slot.types.ts` — Slot 类型定义
  - `src/types/capability.types.ts` — Capability 类型定义
  - `src/types/index.ts` — 更新 barrel export
  - `src/services/StorageService.ts` — 修改：schema v2 + Slot/Capability CRUD + clone
  - `src/hooks/useWorkUnitEditor.ts` — 新增：单个 Work Unit 编辑 hook
  - `src/hooks/index.ts` — 更新 barrel export
  - `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 重构为编辑器
  - `src/components/WorkUnitList/WorkUnitListComponent.tsx` — 可能修改：增加复制入口
  - `tests/storageService.test.ts` — 修改：增加 Slot/Capability/clone 测试
  - `tests/workUnitDetailComponent.test.tsx` — 新增：编辑器渲染测试

### Testing Requirements

- 复用 Vitest + @testing-library/react + fake-indexeddb
- 测试重点：
  - **StorageService**：schema 升级兼容性、Slot CRUD、Capability CRUD 和排序、clone 功能
  - **WorkUnitDetailComponent**：编辑名称/描述、添加/编辑/删除 Slot、添加/编辑/删除/排序 Capability
  - **回归**：W1 的 73 个测试不能破
- 交付前必须通过：`npm run lint`、`npm run build`、`npm test`

### Previous Story Intelligence

- **W1 建立的模式（必须沿用）**：
  - `StorageService` 是 Dexie 唯一入口，写入在事务内
  - Hook 封装 Service 调用，组件不直连 Service
  - 列表项 key 使用 `wu-${id}` composite key
  - 搜索用客户端过滤（`name.toLowerCase().includes()`）
  - 删除用 `window.confirm` 确认
  - 相对时间格式化用 `formatRelativeTime()`
  - 来源标签用 `sourceTypeLabel()` 映射
- **B0 code review 自审清单**：
  - `generateId` 使用 `crypto.randomUUID()` + 降级
  - 时间处理用 `isNaN` 检测
  - React list key 用 composite key
  - 演示数据放 `useMemo`
  - 构建参数类型归入 `src/types/`
- **Deferred work 影响评估**：
  - W2（Helper 无运行时输入校验）— 等 Zod 引入时统一处理，当前不阻塞
  - W3（failureReason 条件必填）— 与本 story 无关

### Project Structure Notes

- `src/services/StorageService.ts` 已存在，需要扩展而不是重建
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` 已存在（W1 占位），需要重构
- `src/types/` 下已有 4 个类型文件（workUnit/decision/writeback/observation），新增 2 个

### References

- `docs/analysis/product-brief-Qomo-2025-12-27.md` — W2a 定义（第 3482 行）、最小 AC（第 3580 行）、对象模型定义（第 1225-1253 行）、参数化约束（第 3491、3608-3609 行）
- `_bmad-output/planning-artifacts/prd.md` — FR1-FR4（Work Unit CRUD）、FR8-FR14（Slot/Capability 管理）、FR77（能力声明）
- `docs/project-planning-artifacts/architecture.md` — Dexie 一致性规则（第 215-236 行）、分层硬约束（第 192-205 行）
- `docs/implementation-artifacts/w1-continue-governance-entry.md` — W1 完成记录与文件清单
- `docs/implementation-artifacts/b0-1-unified-object-identity-version-lineage-references.md` — B0.1 身份语义 contract
- `docs/implementation-artifacts/epic-b0-retro-2026-03-31.md` — Epic B0 回顾报告（自审清单来源）
- `CLAUDE.md` — 仓库结构、文件位置、测试与命名规范

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- sprint-status.yaml 使用 `w2a-work-unit-core-structure-declaration` 风格 key。

### Completion Notes List

- 本故事文件由 `create-story` 工作流生成。
- 目标 story：`w2a-work-unit-core-structure-declaration`

### File List

**新增文件：**
- `src/types/slot.types.ts` — Slot 类型定义（SlotType + Slot interface）
- `src/types/capability.types.ts` — Capability 类型定义
- `src/hooks/useWorkUnitEditor.ts` — 单个 Work Unit 编辑 hook
- `tests/slot.types.test.ts` — 类型契约测试（5 tests）
- `tests/workUnitDetailComponent.test.tsx` — 编辑器组件测试（9 tests）

**修改文件：**
- `src/types/index.ts` — 新增 Slot/Capability/SlotType barrel export
- `src/services/StorageService.ts` — schema v2 + description/slots 字段 + Slot CRUD + Capability CRUD + reorder + clone + updateWorkUnitInfo
- `src/hooks/useWorkUnits.ts` — 增加 cloneWorkUnit 方法
- `src/hooks/index.ts` — 增加 useWorkUnitEditor barrel export
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 从占位页重写为结构化编辑器
- `src/components/WorkUnitList/WorkUnitListComponent.tsx` — 增加复制按钮
- `tests/storageService.test.ts` — 增加 schema v2、Slot CRUD、Capability CRUD、clone 测试（+19 tests）
- `tests/workUnitListComponent.test.tsx` — 增加复制测试（+1 test）

**测试统计：** 107 tests（W1 的 73 + W2a 新增 34），全部通过。
