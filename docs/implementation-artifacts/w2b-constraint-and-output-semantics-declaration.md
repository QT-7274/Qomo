# Story W2b: 约束与输出语义声明

Status: ready-for-dev

## Story

作为一个在 Web 设计台中定义 AI 工作方式的 Qomo 用户，
我希望能为 `Work Unit` 声明约束语义（输出格式、边界规则、质量检查），
从而让我的 Prompt 不只有能力结构，还有明确的输出期望与质量守卫。

## Acceptance Criteria

1. **为 Work Unit 添加约束包**
   - Given 用户在 Work Unit 详情页，
   - When 添加一个约束包，
   - Then 需指定名称、类型（output / boundary / quality）、内容，约束包出现在该 Work Unit 的约束列表中（FR16）。

2. **编辑和删除约束包**
   - Given 一个已有的约束包，
   - When 用户编辑内容或删除，
   - Then 修改立即生效并持久化；删除需确认（FR17、FR18）。

3. **定义输出格式约束**
   - Given 约束包类型为 output，
   - When 用户定义输出格式要求，
   - Then 可指定格式（Markdown / JSON / 表格等）和长度限制（字数 / 行数），持久化到 IndexedDB（FR19、FR20）。

4. **定义质量检查清单**
   - Given 约束包类型为 quality，
   - When 用户添加检查项，
   - Then 每个检查项有文本和是否必需标记，支持增删改和排序（FR21）。

5. **约束列表展示**
   - Given Work Unit 已有约束包，
   - When 用户查看详情页，
   - Then 约束包按类型分组展示，每个显示名称、类型标签和内容摘要（FR22）。

6. **约束排序**
   - Given 多个约束包存在，
   - When 用户调整顺序，
   - Then 排序立即生效并持久化。

7. **结构可被后续 Story 消费**
   - Given W2c/W3/W4 依赖 W2b 建立的约束语义，
   - When 后续 Story 读取 Work Unit，
   - Then 约束结构已稳定且可被扩展。

## Tasks / Subtasks

- [ ] **任务 1：定义约束共享类型** (AC: 1, 3, 4, 7)
  - [ ] 在 `src/types/` 新增 `constraint.types.ts`，定义 `ConstraintType`、`ConstraintPack`、`OutputFormatType`、`LengthLimit`、`ChecklistItem`
  - [ ] 更新 `src/types/index.ts` barrel export
  - [ ] 更新 `Slot` 接口，增加可选 `constraints: ConstraintPack[]` 字段
  - [ ] 类型设计需预留 W2c（待补齐项语义）扩展空间

- [ ] **任务 2：扩展 StorageService 的约束持久化** (AC: 1, 2, 3, 4, 6)
  - [ ] 升级 Dexie schema 到 version(3)：`WorkUnitRecord` 新增 `constraints` 字段（Work Unit 级约束包列表）
  - [ ] 新增约束包 CRUD 方法：`addConstraint()`、`updateConstraint()`、`deleteConstraint()`、`reorderConstraints()`
  - [ ] 新增检查项 CRUD 方法：`addChecklistItem()`、`updateChecklistItem()`、`deleteChecklistItem()`、`reorderChecklistItems()`
  - [ ] 所有写入在 Dexie 事务内完成

- [ ] **任务 3：扩展 useWorkUnitEditor hook** (AC: 1-6)
  - [ ] 在 `useWorkUnitEditor` 中新增约束包操作方法
  - [ ] 新增检查项操作方法
  - [ ] 组件层通过 hook 消费，不直接调用 Service

- [ ] **任务 4：建立约束编辑面板** (AC: 1, 2, 5, 6)
  - [ ] 在 `WorkUnitDetailComponent` 中新增约束区域（在 Slot 列表之后）
  - [ ] 展示约束包列表，按类型（output / boundary / quality）分组或显示类型标签
  - [ ] 添加 / 编辑 / 删除约束包的交互入口
  - [ ] 约束包排序（上移 / 下移按钮）

- [ ] **任务 5：实现输出格式约束编辑** (AC: 3)
  - [ ] 当约束类型为 output 时，显示额外字段：格式选择（下拉）、长度限制（单位 + 数值）
  - [ ] 格式选项：markdown / json / table / plaintext / yaml / csv
  - [ ] 长度限制：单位（characters / words / lines）+ 可选 min / max

- [ ] **任务 6：实现质量检查清单编辑** (AC: 4)
  - [ ] 当约束类型为 quality 时，显示检查项列表
  - [ ] 添加 / 编辑 / 删除检查项
  - [ ] 每个检查项有文本和是否必需标记
  - [ ] 检查项排序（上移 / 下移）

- [ ] **任务 7：测试与质量门槛** (AC: 1-7)
  - [ ] StorageService 约束 CRUD 测试（约束包增删改查、排序、检查项 CRUD）
  - [ ] 组件渲染测试（约束面板、输出格式编辑、质量检查清单）
  - [ ] 确保 `npm run lint`、`npm run build`、`npm test` 全部通过
  - [ ] W2a 的 107 个已有测试不能回归

## Dev Notes

### Developer Context

- 这是 Epic 1 的第三个 story，紧接 W2a。W2b 依赖 W2a 建立的 Slot/Capability 结构。
- W2a 已建立：
  - `StorageService` schema v2：`WorkUnitRecord` 含 `id, name, description, sourceType, slots, createdAt, updatedAt`
  - `Slot` 类型含 `capabilities: Capability[]`、`SlotType` 五种类型
  - `Capability` 类型含 `id, name, content, order`
  - `useWorkUnitEditor` hook：封装单个 Work Unit 的全部编辑操作
  - `WorkUnitDetailComponent`：结构化编辑器（名称/描述编辑、Slot/Capability 管理、排序、复制）
  - `useWorkUnits` hook：列表 CRUD + cloneWorkUnit
  - 107 个测试全部通过
- W2b 的核心任务是**在已有结构上增加约束语义层**，不重构 W2a 的代码。
- W2c（待补齐项语义）依赖 W2b，所以类型设计需预留扩展字段。

### Technical Requirements

- **约束类型设计**：
  - `ConstraintType`：`'output'` | `'boundary'` | `'quality'`
  - `ConstraintPack` 核心字段：`id`、`name`、`constraintType`、`content`（文本）、`order`
  - Output 约束额外字段：`outputFormat?: OutputFormatType`、`lengthLimit?: LengthLimit`
  - Quality 约束额外字段：`checklistItems?: ChecklistItem[]`
  - Boundary 约束当前只有 `content` 文本（预留 W2c/V 系列扩展）
  - `OutputFormatType`：`'markdown'` | `'json'` | `'table'` | `'plaintext'` | `'yaml'` | `'csv'`
  - `LengthLimit`：`{ unit: 'characters' | 'words' | 'lines', min?: number, max?: number }`
  - `ChecklistItem`：`{ id: string, text: string, required: boolean, order: number }`
- **约束存储位置决策**：
  - 约束包存储在 `WorkUnitRecord.constraints: ConstraintPack[]`（Work Unit 级别）
  - 不在 Slot 级别存储约束（PRD FR16 明确是"为 Work Unit 添加约束包"）
  - Dexie schema 升级到 version(3)，新增 `constraints` 字段
- **Dexie schema 升级**：
  - 从 version(2) 升级到 version(3)
  - `constraints` 作为嵌套 JSON 存储在 `WorkUnitRecord` 中
  - 升级迁移：已有记录默认 `constraints = []`
- **不引入 Zod**：运行时输入校验仍为 deferred work，等统一引入
- **cloneWorkUnit 需更新**：复制时须深拷贝 `constraints`（含 `checklistItems`），分配新 ID

### Architecture Compliance

- 分层硬约束继续执行：`Component → Hook → Service → Dexie`
- 所有持久化操作必须走 `StorageService`，在 Dexie 事务内完成
- 类型在 `src/types/` 下，组件在 `src/components/`
- 命名遵循 `docs/mault.yaml`：`*.types.ts`、`use*.ts`、`*Service.ts`、`*Component.tsx`

### Library / Framework Requirements

- 沿用 W2a 已安装的：`react` ^18.3.1、`dexie`、`react-router-dom`、`vitest`、`fake-indexeddb`
- **不引入新依赖**。表单用原生 HTML 元素。

### File Structure Requirements

- 新增/修改文件方向：
  - `src/types/constraint.types.ts` — 约束类型定义（新增）
  - `src/types/slot.types.ts` — 可能修改：Slot 增加可选 constraints 字段（评估是否需要）
  - `src/types/index.ts` — 更新 barrel export
  - `src/services/StorageService.ts` — 修改：schema v3 + 约束 CRUD + clone 更新
  - `src/hooks/useWorkUnitEditor.ts` — 修改：增加约束操作方法
  - `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 修改：增加约束编辑面板
  - `tests/constraint.types.test.ts` — 新增：约束类型契约测试
  - `tests/storageService.test.ts` — 修改：增加约束 CRUD 测试
  - `tests/workUnitDetailComponent.test.tsx` — 修改：增加约束面板渲染测试

### Testing Requirements

- 复用 Vitest + @testing-library/react + fake-indexeddb
- 测试重点：
  - **StorageService**：schema v3 升级兼容性、约束包 CRUD + 排序、检查项 CRUD + 排序、clone 含约束深拷贝
  - **WorkUnitDetailComponent**：添加/编辑/删除约束包、输出格式编辑、质量检查清单编辑
  - **回归**：W2a 的 107 个测试不能破
- 交付前必须通过：`npm run lint`、`npm run build`、`npm test`

### Previous Story Intelligence

- **W2a 建立的模式（必须沿用）**：
  - `StorageService` 嵌套 JSON 模式（Slot/Capability 在 WorkUnitRecord 内，不建独立表）
  - CRUD 方法签名模式：`addXxx(workUnitId, params)`、`updateXxx(workUnitId, xxxId, params)`、`deleteXxx(workUnitId, xxxId)`
  - 排序方法：`reorderXxx(workUnitId, orderedIds)`，按 ID 数组重建 order
  - `cloneWorkUnit` 深拷贝所有嵌套结构，为每个对象分配新 ID
  - Hook 封装 Service 调用，组件不直连 Service
  - 组件用 `window.confirm` 确认删除，内联 `React.CSSProperties` 样式
  - 测试用 `beforeEach` 清空数据库，组件测试用 `MemoryRouter`
  - `generateId()` 用 `crypto.randomUUID()` + 降级
  - 所有写入自动刷新 `updatedAt`
- **W2a code review 模式**：
  - 类型定义加 JSDoc 注释
  - 接口参数类型独立定义（如 `AddSlotParams`）
  - `deleteSlot` 有 capabilities 守卫（`capabilities.length > 0` 时拒绝）
  - Capability 的 `order` 从 `maxOrder + 1` 自增
- **Deferred work 影响评估**：
  - W2（Helper 无运行时输入校验）— 等 Zod 引入时统一处理，当前不阻塞
  - W2b 不引入 Zod，约束字段类型安全由 TypeScript 保证

### Project Structure Notes

- `src/services/StorageService.ts` 已存在且已被 W2a 扩展，需要继续扩展
- `src/hooks/useWorkUnitEditor.ts` 已存在，需要增加约束方法
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` 已存在（W2a 编辑器），需要增加约束面板
- `src/types/` 下已有 6 个类型文件，新增 1 个 `constraint.types.ts`

### References

- `_bmad-output/planning-artifacts/prd.md` — FR16-FR22（约束与输出管理）、FR5（Work Unit 完整详情含约束）、FR22-FR24（预览含约束）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — 约束包定义（第 65-68 行）：输出约束、边界约束、质量约束三类
- `docs/project-planning-artifacts/architecture.md` — Dexie 一致性规则（第 215-236 行）、分层硬约束（第 192-205 行）
- `docs/implementation-artifacts/w2a-work-unit-core-structure-declaration.md` — W2a 完成记录、扩展预留说明
- `docs/implementation-artifacts/deferred-work.md` — Zod 校验 deferred（W2 条目）
- `CLAUDE.md` — 仓库结构、文件位置、测试与命名规范

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- sprint-status.yaml 使用 `w2b-constraint-and-output-semantics-declaration` 风格 key。

### Completion Notes List

- 本故事文件由 `create-story` 工作流生成。
- 目标 story：`w2b-constraint-and-output-semantics-declaration`

### File List
