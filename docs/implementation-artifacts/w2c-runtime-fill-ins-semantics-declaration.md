# Story W2c: 待补齐项语义声明

Status: done

## Story

作为一个在 Web 设计台中定义 AI 工作方式的 Qomo 用户，
我希望能为 `Work Unit` 的 Slot 声明"哪些信息需要到运行时现场补齐"，
从而让我在设计时就能明确区分"已确定的结构"与"留到 VS Code 现场再补的输入位"，避免伪装成已知。

## Acceptance Criteria

1. **为 Slot 声明待补齐语义**
   - Given 用户在 Work Unit 详情页编辑一个 Slot，
   - When 标记该 Slot 含有待补齐项，
   - Then 可指定补齐方式（auto / user-confirm / manual）和提示文本，信息持久化到 IndexedDB。

2. **编辑和删除待补齐声明**
   - Given 一个已有待补齐声明的 Slot，
   - When 用户修改补齐方式、提示文本或清除声明，
   - Then 修改立即生效并持久化。

3. **待补齐状态可视化**
   - Given Work Unit 中有 Slot 含待补齐声明，
   - When 用户查看详情页，
   - Then 含待补齐项的 Slot 显示明确的视觉标记（图标或标签），区分于已完全定义的 Slot。

4. **待补齐摘要**
   - Given Work Unit 含有多个待补齐项，
   - When 用户查看详情页，
   - Then 页面底部或专区显示待补齐摘要（总数、按补齐方式分组），为 W3 交接准备预览提供数据源。

5. **补齐方式语义清晰**
   - Given 三种补齐方式（auto / user-confirm / manual），
   - When 系统在 VS Code 端消费该声明，
   - Then auto 表示可从 workspace 自动提取、user-confirm 表示需用户显式确认、manual 表示需手动输入或标记暂缺。

6. **结构可被后续 Story 消费**
   - Given W3/V2 依赖 W2c 建立的待补齐语义，
   - When 后续 Story 读取 Work Unit，
   - Then 待补齐项结构已稳定且可被扩展。

## Tasks / Subtasks

- [ ] **任务 1：定义待补齐项共享类型** (AC: 1, 5, 6)
  - [ ] 在 `src/types/` 新增 `fillIn.types.ts`，定义 `FillInMethod`、`FillInDeclaration`
  - [ ] 更新 `src/types/index.ts` barrel export
  - [ ] 更新 `Slot` 接口，增加可选 `fillIn?: FillInDeclaration` 字段
  - [ ] 类型设计需预留 V2（现场补齐执行）扩展空间

- [ ] **任务 2：扩展 StorageService 的待补齐持久化** (AC: 1, 2)
  - [ ] 升级 Dexie schema 到 version(4)：`Slot` 嵌套结构新增 `fillIn` 可选字段
  - [ ] 新增待补齐声明 CRUD 方法：`setSlotFillIn()`、`clearSlotFillIn()`
  - [ ] 所有写入在 Dexie 事务内完成
  - [ ] `cloneWorkUnit` 需更新：复制时须保留 Slot 的 `fillIn` 声明

- [ ] **任务 3：扩展 useWorkUnitEditor hook** (AC: 1, 2)
  - [ ] 在 `useWorkUnitEditor` 中新增 `setSlotFillIn` 和 `clearSlotFillIn` 方法
  - [ ] 组件层通过 hook 消费，不直接调用 Service

- [ ] **任务 4：Slot 待补齐声明 UI** (AC: 1, 2, 3)
  - [ ] 在 Slot 编辑区域增加"待补齐"开关或入口
  - [ ] 开启后显示补齐方式选择（auto / user-confirm / manual 下拉）和提示文本输入
  - [ ] 含待补齐声明的 Slot 在列表中显示视觉标记（如"🔲 待补齐"标签）
  - [ ] 编辑/清除待补齐声明

- [ ] **任务 5：待补齐摘要区域** (AC: 4)
  - [ ] 在 `WorkUnitDetailComponent` 中新增待补齐摘要区域（在约束面板之后）
  - [ ] 显示待补齐项总数
  - [ ] 按补齐方式（auto / user-confirm / manual）分组统计
  - [ ] 列出每个待补齐 Slot 的名称和补齐方式

- [ ] **任务 6：测试与质量门槛** (AC: 1-6)
  - [ ] StorageService 待补齐 CRUD 测试（setSlotFillIn、clearSlotFillIn、clone 含 fillIn 深拷贝）
  - [ ] 组件渲染测试（待补齐标记、补齐方式选择、摘要区域）
  - [ ] 确保 `npm run lint`、`npm run build`、`npm test` 全部通过
  - [ ] W2b 的 133 个已有测试不能回归

## Dev Notes

### Developer Context

- 这是 Epic 1 的第四个 story，紧接 W2b。W2c 依赖 W2a 建立的 Slot 结构，与 W2b 可并行但排在其后。
- W2a 已建立：
  - `StorageService` schema v2：`WorkUnitRecord` 含 `id, name, description, sourceType, slots, createdAt, updatedAt`
  - `Slot` 类型含 `capabilities: Capability[]`、`SlotType` 五种类型、`description`、`required`
  - `useWorkUnitEditor` hook：封装单个 Work Unit 的全部编辑操作
  - `WorkUnitDetailComponent`：结构化编辑器
- W2b 已建立：
  - `StorageService` schema v3：`WorkUnitRecord` 新增 `constraints: ConstraintPack[]`
  - 约束包 CRUD + 检查项 CRUD + 排序
  - `cloneWorkUnit` 已深拷贝 Slot/Capability/Constraint/ChecklistItem
  - 约束编辑面板（添加/删除/排序/类型标签）
  - 133 个测试全部通过
- W2c 的核心任务是**在 Slot 上增加待补齐语义层**，不重构 W2a/W2b 的代码。
- V2（现场补齐上下文）和 W3（交接准备预览）依赖 W2c，所以类型设计需预留扩展。

### Technical Requirements

- **待补齐类型设计**：
  - `FillInMethod`：`'auto'` | `'user-confirm'` | `'manual'`
    - `auto`：可从 workspace 自动提取（如仓库路径、当前文件）
    - `user-confirm`：需用户显式确认（如任务目标、关键上下文）
    - `manual`：需手动输入或标记暂缺（如特殊要求、临时补充）
  - `FillInDeclaration`：`{ method: FillInMethod, hint?: string }`
    - `method`：补齐方式
    - `hint`：提示文本，向 VS Code 端说明该位需要什么信息
- **待补齐存储位置决策**：
  - 待补齐声明存储在 `Slot.fillIn?: FillInDeclaration`（Slot 级别）
  - 产品语义明确：Web 只声明"哪些位需要到现场补齐"，不替现场裁决
  - Slot 的 `fillIn` 为可选字段——没有 fillIn 表示该 Slot 在设计时已完全定义
- **Dexie schema 升级**：
  - 从 version(3) 升级到 version(4)
  - `fillIn` 作为 Slot 嵌套 JSON 内的可选字段，不需要独立迁移（Slot 已是嵌套 JSON）
  - 升级迁移：已有 Slot 默认无 `fillIn`（undefined），无需修改现有数据
- **不引入 Zod**：运行时输入校验仍为 deferred work，等统一引入
- **cloneWorkUnit 需验证**：复制时 Slot 的 `fillIn` 声明应被保留（`...slot` 展开已自动包含）

### Architecture Compliance

- 分层硬约束继续执行：`Component → Hook → Service → Dexie`
- 所有持久化操作必须走 `StorageService`，在 Dexie 事务内完成
- 类型在 `src/types/` 下，组件在 `src/components/`
- 命名遵循 `docs/mault.yaml`：`*.types.ts`、`use*.ts`、`*Service.ts`、`*Component.tsx`

### Library / Framework Requirements

- 沿用 W2b 已安装的：`react` ^18.3.1、`dexie`、`react-router-dom`、`vitest`、`fake-indexeddb`
- **不引入新依赖**。表单用原生 HTML 元素。

### File Structure Requirements

- 新增/修改文件方向：
  - `src/types/fillIn.types.ts` — 待补齐类型定义（新增）
  - `src/types/slot.types.ts` — 修改：Slot 增加可选 `fillIn` 字段
  - `src/types/index.ts` — 更新 barrel export
  - `src/services/StorageService.ts` — 修改：schema v4 + setSlotFillIn/clearSlotFillIn
  - `src/hooks/useWorkUnitEditor.ts` — 修改：增加待补齐操作方法
  - `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 修改：增加待补齐 UI（Slot 标记 + 声明编辑 + 摘要区域）
  - `tests/fillIn.types.test.ts` — 新增：待补齐类型契约测试
  - `tests/storageService.test.ts` — 修改：增加 fillIn CRUD + clone 含 fillIn 测试
  - `tests/workUnitDetailComponent.test.tsx` — 修改：增加待补齐 UI 渲染测试

### Testing Requirements

- 复用 Vitest + @testing-library/react + fake-indexeddb
- 测试重点：
  - **StorageService**：schema v4 升级兼容性、setSlotFillIn/clearSlotFillIn、clone 含 fillIn 保留
  - **WorkUnitDetailComponent**：待补齐标记显示、补齐方式选择交互、摘要区域渲染
  - **回归**：W2b 的 133 个测试不能破
- 交付前必须通过：`npm run lint`、`npm run build`、`npm test`

### Previous Story Intelligence

- **W2a/W2b 建立的模式（必须沿用）**：
  - `StorageService` 嵌套 JSON 模式（Slot/Capability/Constraint 在 WorkUnitRecord 内，不建独立表）
  - CRUD 方法签名模式：`addXxx(workUnitId, params)`、`updateXxx(workUnitId, xxxId, params)`、`deleteXxx(workUnitId, xxxId)`
  - W2c 的 fillIn 操作签名建议：`setSlotFillIn(workUnitId, slotId, fillIn)`、`clearSlotFillIn(workUnitId, slotId)`
  - `cloneWorkUnit` 深拷贝所有嵌套结构（Slot 展开时 fillIn 自动保留）
  - Hook 封装 Service 调用，组件不直连 Service
  - 组件用 `window.confirm` 确认删除，内联 `React.CSSProperties` 样式
  - 测试用 `beforeEach` 清空数据库，组件测试用 `MemoryRouter`
  - `generateId()` 用 `crypto.randomUUID()` + 降级
  - 所有写入自动刷新 `updatedAt`
- **W2b code review 模式**：
  - 类型定义加 JSDoc 注释
  - 接口参数类型独立定义（如 `AddConstraintParams`）
  - maxOrder 从已有列表计算 + 1
  - schema 升级用 `.upgrade()` 回调处理已有数据
- **Deferred work 影响评估**：
  - W2（Helper 无运行时输入校验）— 等 Zod 引入时统一处理，当前不阻塞
  - W2c 不引入 Zod，类型安全由 TypeScript 保证

### 关键设计决策

1. **fillIn 放在 Slot 上而非 Capability 上**：产品语义是"该输入位（Slot）需要到现场补齐"，而非"某个能力块需要补齐"。Slot 是结构骨架节点，代表一个输入位。
2. **schema v4 迁移无需修改数据**：`fillIn` 是 Slot 嵌套 JSON 内的可选字段，已有 Slot 天然没有该字段（undefined），无需显式迁移。但为保持一致性，仍需声明 version(4)。
3. **不需要独立 fillIn 排序**：fillIn 是 Slot 的属性，Slot 本身已有排序（通过数组顺序）。
4. **摘要为只读计算**：待补齐摘要从 Slot 列表实时计算，不需要独立存储。

### Project Structure Notes

- `src/services/StorageService.ts` 已存在且已被 W2a/W2b 扩展，需要继续扩展
- `src/hooks/useWorkUnitEditor.ts` 已存在，需要增加 fillIn 方法
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` 已存在（W2a 编辑器 + W2b 约束面板），需要增加待补齐 UI
- `src/types/` 下已有 7 个类型文件，新增 1 个 `fillIn.types.ts`
- `src/types/slot.types.ts` 需要修改：增加 `fillIn` 可选字段并 import `FillInDeclaration`

### References

- `docs/analysis/product-brief-Qomo-2025-12-27.md` — W2c 定义（第 3484 行）、最小 AC（第 3580 行）、设计时 vs 运行时分界（第 1693-1697 行）、三步补齐节奏（第 1760-1770 行）、待补齐项口径（第 2776 行）
- `_bmad-output/planning-artifacts/prd.md` — FR8-FR9（Slot 配置）、FR23-FR27（预览与生成含待补齐）、FR51-FR52（VS Code 补齐上下文）
- `docs/project-planning-artifacts/architecture.md` — Dexie 一致性规则（第 215-236 行）、分层硬约束（第 192-205 行）
- `docs/implementation-artifacts/w2a-work-unit-core-structure-declaration.md` — W2a 完成记录、Slot 结构定义
- `docs/implementation-artifacts/w2b-constraint-and-output-semantics-declaration.md` — W2b 完成记录、schema v3 模式
- `docs/implementation-artifacts/deferred-work.md` — Zod 校验 deferred（W2 条目）
- `CLAUDE.md` — 仓库结构、文件位置、测试与命名规范

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- sprint-status.yaml 使用 `w2c-runtime-fill-ins-semantics-declaration` 风格 key。

### Completion Notes List

- 本故事文件由 `create-story` 工作流生成。
- 目标 story：`w2c-runtime-fill-ins-semantics-declaration`
- 实施由 subagent-driven-development 完成，4 个实施任务 + 1 个验证任务。

### File List

**新增文件：**
- `src/types/fillIn.types.ts` — 待补齐类型定义（FillInMethod + FillInDeclaration）
- `tests/fillIn.types.test.ts` — 类型契约测试（5 tests）

**修改文件：**
- `src/types/slot.types.ts` — Slot 增加可选 `fillIn?: FillInDeclaration` 字段
- `src/types/index.ts` — 新增 FillInMethod / FillInDeclaration barrel export
- `src/services/StorageService.ts` — schema v4 + setSlotFillIn / clearSlotFillIn
- `src/hooks/useWorkUnitEditor.ts` — 增加 2 个待补齐操作方法
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 增加待补齐标签 + 摘要区域
- `tests/storageService.test.ts` — 增加 fillIn CRUD、clone fillIn 测试（+8 tests）
- `tests/workUnitDetailComponent.test.tsx` — 增加待补齐 UI 渲染测试（+4 tests）

**测试统计：** 150 tests（W2b 的 133 + W2c 新增 17），全部通过。
