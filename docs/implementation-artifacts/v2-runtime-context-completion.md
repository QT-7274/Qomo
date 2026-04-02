# Story 2.2: V2 现场补齐上下文

Status: done

## Story

作为一个已在启动台选中 Work Unit 的 Qomo 用户，
我希望能在 `/launch/:id` 页面补齐当前仓库、文件、任务目标等启动所需上下文，
从而形成一个结构化的 `LaunchContextEnvelope`，为后续 V3a（capability 可用性判断）提供完整输入。

## Acceptance Criteria

1. **待补齐项清单展示**
   - Given 用户已进入 `/launch/:id` 启动会话，
   - When 系统加载 Work Unit 快照中的 Slot 结构，
   - Then 系统从所有带 `fillIn` 声明的 Slot 中提取待补齐项，按三类分组展示：
     - 🟢 **自动带入**（`method: 'auto'`）：系统可自动填充的项
     - 🟡 **需确认**（`method: 'user-confirm'`）：需用户显式确认的项
     - 🔴 **手动补齐**（`method: 'manual'`）：需用户手动输入的项
   - （FR51、FR52）

2. **任务目标输入**
   - Given 待补齐清单已展示，
   - When 用户在"任务目标"文本框中输入本次任务的具体目标，
   - Then 输入值实时保存到 `LaunchContextEnvelope.taskGoal`，输入框下方显示已输入/未输入状态。

3. **仓库 / 项目信息补齐**
   - Given 待补齐清单已展示，
   - When 用户在"仓库/项目"输入区域填写仓库名称或项目路径，
   - Then 输入值保存到 `LaunchContextEnvelope.workspace`。
   - 由于当前仍为 Web SPA（非真实 VS Code 环境），本 story 不做自动采集，仅提供手动输入。

4. **相关文件补齐**
   - Given 待补齐清单已展示，
   - When 用户在"相关文件"区域添加文件路径（支持逐条添加和删除），
   - Then 文件列表保存到 `LaunchContextEnvelope.files`。

5. **附加说明补齐**
   - Given 待补齐清单已展示，
   - When 用户在"附加说明"文本框输入额外上下文信息，
   - Then 输入值保存到 `LaunchContextEnvelope.additionalNotes`。

6. **完整性状态实时计算**
   - Given 用户正在补齐上下文，
   - When 任何输入发生变化，
   - Then 系统实时计算并显示完整性摘要：
     - 必需项完成数 / 必需项总数
     - 可选项完成数 / 可选项总数
     - 整体完整性状态：`complete`（全部必需项已补齐）/ `partial`（部分必需项缺失）/ `empty`（无任何输入）
   - 完整性状态展示在页面顶部区域。

7. **缺失清单提示**
   - Given 存在未补齐的必需项（`required: true` 的 Slot 有 `fillIn` 但未输入），
   - When 用户查看完整性摘要区域，
   - Then 显示缺失项列表，每项显示 Slot 名称 + fillIn.hint 文案，引导用户补齐。

8. **LaunchContextEnvelope 数据结构**
   - Given 用户完成上下文补齐（全部或部分），
   - When 查看内存中的 envelope 对象，
   - Then 包含以下结构化数据：
     - `sessionId`：当前启动会话 ID
     - `snapshotId`：所消费的快照 ID
     - `taskGoal`：任务目标文本
     - `workspace`：仓库/项目标识
     - `files`：相关文件列表
     - `additionalNotes`：附加说明
     - `slotFillStatus`：每个待补齐 Slot 的完成状态（slotId → filled/empty）
     - `completeness`：整体完整性（complete/partial/empty）
     - `collectedAt`：采集时间戳

9. **内容不丢失**
   - Given 用户已填写部分上下文信息，
   - When 用户在启动会话页内切换操作（如滚动、折叠/展开区域），
   - Then 已填写内容不会丢失。
   - 注意：本 story 不要求跨路由持久化（离开 `/launch/:id` 后数据可丢失）。

10. **V2 占位替换**
    - Given V1 在 LaunchSessionComponent 中有 V2 占位区域，
    - When V2 实现完成，
    - Then 占位区域被真实的上下文补齐表单替换。

## Tasks / Subtasks

- [x] **任务 1：定义 LaunchContextEnvelope 类型** (AC: 8)
  - [x] 在 `src/types/launch.types.ts` 新增 `LaunchContextEnvelope` 接口：sessionId, snapshotId, taskGoal, workspace, files, additionalNotes, slotFillStatus, completeness, collectedAt
  - [x] 新增 `ContextCompleteness` 类型：`'complete' | 'partial' | 'empty'`
  - [x] 新增 `SlotFillStatus` 类型：`Record<string, 'filled' | 'empty'>`
  - [x] 新增 `FillInItem` 辅助类型：从 Slot + FillIn 提取的待补齐项视图（slotId, slotName, method, hint, required, filled）

- [x] **任务 2：提取待补齐项工具函数** (AC: 1, 6, 7)
  - [x] 在 `src/utils/` 新增 `contextEnvelopeUtil.ts`
  - [x] 实现 `extractFillInItems(slots: Slot[]): FillInItem[]` — 从 Slot 列表中提取所有带 fillIn 的项
  - [x] 实现 `computeCompleteness(items: FillInItem[], envelope: Partial<LaunchContextEnvelope>): ContextCompleteness` — 计算完整性
  - [x] 实现 `computeSlotFillStatus(items: FillInItem[], envelope: Partial<LaunchContextEnvelope>): SlotFillStatus` — 计算逐项状态
  - [x] 实现 `getMissingRequiredItems(items: FillInItem[], envelope: Partial<LaunchContextEnvelope>): FillInItem[]` — 返回缺失的必需项

- [x] **任务 3：工具函数测试** (AC: 1, 6, 7)
  - [x] extractFillInItems：有 fillIn / 无 fillIn / 混合 Slot
  - [x] computeCompleteness：complete / partial / empty 各场景
  - [x] computeSlotFillStatus：全填 / 部分填 / 全空
  - [x] getMissingRequiredItems：有缺失 / 无缺失

- [x] **任务 4：useLaunchContext Hook** (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [x] 在 `src/hooks/` 新增 `useLaunchContext.ts`
  - [x] 接收 `slots: Slot[]` + `sessionId: string` + `snapshotId?: string` 参数
  - [x] 维护 `envelope: Partial<LaunchContextEnvelope>` 内部状态
  - [x] 暴露 `setTaskGoal(v: string)`, `setWorkspace(v: string)`, `addFile(path: string)`, `removeFile(path: string)`, `setAdditionalNotes(v: string)` 方法
  - [x] 暴露 `fillInItems`, `completeness`, `missingRequired`, `slotFillStatus` 计算值
  - [x] 暴露 `buildEnvelope(): LaunchContextEnvelope` — 构建最终 envelope 快照

- [x] **任务 5：ContextCompletionSection 组件** (AC: 1, 2, 3, 4, 5, 6, 7, 10)
  - [x] 在 `src/components/LaunchSession/` 新增 `ContextCompletionSection.tsx`（不是独立文件夹，作为 LaunchSession 的子组件）
  - [x] 顶部：完整性状态摘要（进度条或文字：必需 X/Y 已补齐）
  - [x] 缺失清单区域：列出未补齐必需项（slotName + hint）
  - [x] 任务目标：多行文本框
  - [x] 仓库/项目：单行输入框
  - [x] 相关文件：列表 + 添加输入框 + 删除按钮
  - [x] 附加说明：多行文本框
  - [x] 所有输入通过 hook 方法更新，不做本组件内的独立状态
  - [x] 替换 V1 的 `placeholderStyle` 占位区域

- [x] **任务 6：集成到 LaunchSessionComponent** (AC: 10)
  - [x] 在 `useLaunchSession` 中暴露 `slots`, `sessionId`, `snapshotId` 供下游使用
  - [x] 在 `LaunchSessionComponent` 中引入 `useLaunchContext` + `ContextCompletionSection`
  - [x] 删除 V1 占位区域，替换为 `ContextCompletionSection`
  - [x] 传递 hook 返回值到子组件

- [x] **任务 7：组件测试** (AC: 1-10)
  - [x] ContextCompletionSection：待补齐项清单渲染（auto/confirm/manual 分组）
  - [x] ContextCompletionSection：任务目标输入 → 完整性更新
  - [x] ContextCompletionSection：文件列表添加/删除
  - [x] ContextCompletionSection：缺失清单展示
  - [x] ContextCompletionSection：完整性状态（complete/partial/empty）正确切换
  - [x] LaunchSessionComponent：V2 占位已被替换为表单

- [x] **任务 8：质量门槛** (AC: 1-10)
  - [x] `npm run lint && npm run build && npm test` 全过
  - [x] V1 的 205 个测试不能破

### Review Findings

- [x] [Review][Patch] computeCompleteness 永远不返回 'partial' — 已修复：按 method 逐 Slot 判断，partial 状态可达
- [x] [Review][Patch] computeSlotFillStatus 使用全局布尔 — 已修复：按 method 类型映射通用输入到 Slot
- [x] [Review][Patch] getMissingRequiredItems 任何输入即清空 — 已修复：逐项检查 method 是否满足
- [x] [Review][Patch] FillInItem.filled 字段从未被更新 — 已修复：移除死字段，改用 slotFillStatus 判断
- [x] [Review][Patch] ContextCompletionSection 可选项计数错误 — 已修复：基于 slotFillStatus 实际计数
- [x] [Review][Dismiss] 组件命名 ContextCompletionSection — 子组件不强制 *Component.tsx 后缀
- [x] [Review][Defer] useLaunchContext 在 loading 时以空参数运行 — MVP 阶段可接受

## Dev Notes

### Developer Context

- **这是 Epic 2 的第二个 story**，紧接 V1（启动入口与对象选择）。
- V1 已提供：`/launch/:id` 路由、`LaunchSessionComponent` 骨架（含 V2 占位区域）、`useLaunchSession` hook（加载 WU + 快照）。
- **V2 的核心**：在 V1 骨架上增加上下文补齐表单，形成 `LaunchContextEnvelope` 数据结构。
- **当前仍为 Web SPA**，不做真实 VS Code workspace 自动采集。`auto` 类型 fillIn 在 Web 端退化为手动输入 + "自动带入"标签提示。
- V2 不持久化 envelope（不写 IndexedDB）——数据只在内存中，离开页面即丢失。后续 V5/O1 才决定是否持久化。
- V2 产出的 `LaunchContextEnvelope` 是后续 V3a（capability 可用性判断）的直接输入。

### Technical Requirements

- **LaunchContextEnvelope 类型设计**：
  ```typescript
  /** 完整性状态 */
  type ContextCompleteness = 'complete' | 'partial' | 'empty';

  /** 逐 Slot 补齐状态 */
  type SlotFillStatus = Record<string, 'filled' | 'empty'>;

  /** 启动上下文信封 — 某次启动的现场上下文封装 */
  interface LaunchContextEnvelope {
    /** 当前启动会话 ID */
    readonly sessionId: string;
    /** 所消费的快照 ID（无快照时为 undefined） */
    readonly snapshotId?: string;
    /** 任务目标 */
    taskGoal: string;
    /** 仓库/项目标识 */
    workspace: string;
    /** 相关文件路径列表 */
    files: string[];
    /** 附加说明 */
    additionalNotes: string;
    /** 逐 Slot 补齐状态 */
    slotFillStatus: SlotFillStatus;
    /** 整体完整性 */
    completeness: ContextCompleteness;
    /** 采集时间戳 */
    collectedAt: ISO8601;
  }
  ```
- **FillInItem 辅助类型**（从 Slot 提取的视图对象，不持久化）：
  ```typescript
  interface FillInItem {
    slotId: string;
    slotName: string;
    method: FillInMethod;       // 'auto' | 'user-confirm' | 'manual'
    hint?: string;
    required: boolean;
    filled: boolean;
  }
  ```
- **completeness 计算规则**：
  - `complete`：所有 `required: true` 且有 `fillIn` 的 Slot 对应的输入已非空
  - `partial`：至少一个必需 fillIn Slot 已填，但还有未填的
  - `empty`：没有任何 fillIn 输入

### Architecture Compliance

- **分层严格遵守**：`Component → Hook → Util`
  - `ContextCompletionSection` 只调用 `useLaunchContext` hook
  - `useLaunchContext` 调用 `contextEnvelopeUtil` 的纯函数
  - **本 story 不涉及 Service/Dexie 层**——envelope 纯内存状态
- **命名规范**：
  - 组件：`ContextCompletionSection.tsx` → `src/components/LaunchSession/`（子组件，不独立文件夹）
  - Hook：`useLaunchContext.ts` → `src/hooks/`
  - Util：`contextEnvelopeUtil.ts` → `src/utils/`
  - 类型：扩展 `src/types/launch.types.ts`
  - 测试：`contextEnvelopeUtil.test.ts`、`contextCompletionSection.test.tsx` → `tests/`
- **barrel exports**：更新 `src/hooks/index.ts`、`src/utils/index.ts`

### Library / Framework Requirements

- **不引入新依赖**——沿用已有：React 18, React Router, Vitest, @testing-library/react
- 表单状态用 React `useState`（不需要 form library，字段少且简单）
- **不要**引入 Zustand / Redux / 任何全局状态管理——envelope 是页面局部状态

### File Structure Requirements

**新增文件：**
- `src/types/launch.types.ts` — 扩展：新增 LaunchContextEnvelope, ContextCompleteness, SlotFillStatus, FillInItem
- `src/utils/contextEnvelopeUtil.ts` — 待补齐项提取 + 完整性计算纯函数
- `src/hooks/useLaunchContext.ts` — 上下文补齐状态管理 hook
- `src/components/LaunchSession/ContextCompletionSection.tsx` — 上下文补齐表单 UI
- `tests/contextEnvelopeUtil.test.ts` — 工具函数测试
- `tests/contextCompletionSection.test.tsx` — 组件测试

**修改文件：**
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — 删除 V2 占位，集成 ContextCompletionSection
- `src/hooks/useLaunchSession.ts` — 额外暴露 sessionId, snapshotId, slots（已有 data.slots，可能需微调）
- `src/hooks/index.ts` — 导出 useLaunchContext
- `src/utils/index.ts` — 导出 contextEnvelopeUtil（如有 barrel）
- `src/types/index.ts` — 导出新类型

### Testing Requirements

- **contextEnvelopeUtil**：extractFillInItems（有/无 fillIn）、computeCompleteness（3 种状态）、getMissingRequiredItems、computeSlotFillStatus
- **ContextCompletionSection**：待补齐项分组渲染、任务目标输入、文件添加/删除、缺失清单展示、完整性状态变化
- **LaunchSessionComponent**：V2 占位已替换为表单、与 useLaunchContext 集成
- **回归**：V1 的 205 个测试不能破
- 交付前：`npm run lint && npm run build && npm test`

### Previous Story Intelligence

- **V1 代码模式**：
  - `useLaunchSession` hook 已加载 WU + 快照，返回 `LaunchSessionData`（含 slots, constraints, handoffStatus, usingSnapshot）
  - `LaunchSessionComponent` 在底部有 `placeholderStyle` 占位区域，V2 需要替换它
  - V1 review 修复了分层架构违规：组件不直接调 Service，必须通过 hook
  - V1 review 提取了 `formatUtil.ts` 避免重复——V2 的工具函数也应放 `src/utils/`
- **FillIn 语义（W2c 产出）**：
  - `FillInDeclaration` 有 `method`（auto/user-confirm/manual）和 `hint`
  - `Slot.fillIn` 为 `undefined` 表示设计时已完全定义，无需现场补齐
  - 在 Web SPA 环境中，`auto` 类型无法真正自动采集，退化为手动输入 + 标签提示
- **内联样式模式**：全项目使用 React `CSSProperties` 对象，不用 CSS 文件或 Tailwind class
- **测试模式**：`fake-indexeddb/auto` + `beforeEach` 清表 + `MemoryRouter` 包裹（组件测试）；纯函数测试直接 import 调用

### Git Intelligence

- 最近提交模式稳定：Service → Hook → Component → Test 逐层实现
- V1 commit: `feat(v1): 启动入口与对象选择 — Epic 2 首个 story 完成`
- V2 应使用 `feat(v2):` 前缀

### References

- `docs/analysis/product-brief-Qomo-2025-12-27.md` — V2 定义（第 3498 行）、最小 AC（第 3589 行）、LaunchContextEnvelope 数据模型（第 1995-2010 行）、现场补齐交互收敛（第 1758-1769 行）
- `_bmad-output/planning-artifacts/prd.md` — FR51（仓库信息补齐）、FR52（任务信息补齐）
- `src/types/fillIn.types.ts` — FillInDeclaration, FillInMethod
- `src/types/slot.types.ts` — Slot（含 fillIn?: FillInDeclaration）
- `src/types/launch.types.ts` — LaunchSession, LaunchSessionStatus
- `src/hooks/useLaunchSession.ts` — 已有数据加载 hook，V2 在此基础上扩展
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — V1 骨架，含 V2 占位
- `src/utils/contextEnvelopeUtil.ts` — V2 新增，待补齐项提取 + 完整性计算
- `CLAUDE.md` — 分层架构、命名规范、内联样式模式

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- 本故事由 `dev-story` 工作流实现。
- 目标 story：`v2-runtime-context-completion`（Epic 2 第二个 story）
- 新增 4 个类型：LaunchContextEnvelope, ContextCompleteness, SlotFillStatus, FillInItem
- 新增 contextEnvelopeUtil.ts：4 个纯函数（extractFillInItems, computeCompleteness, computeSlotFillStatus, getMissingRequiredItems）
- 新增 useLaunchContext hook：上下文补齐状态管理（纯内存，不持久化）
- 新增 ContextCompletionSection 组件：待补齐项清单 + 任务目标/仓库/文件/附加说明表单 + 完整性摘要 + 缺失清单
- 修改 useLaunchSession：暴露 workUnitId, snapshotId 供下游消费
- 修改 LaunchSessionComponent：删除 V1 占位，集成 ContextCompletionSection
- 修改 V1 测试：更新占位检查为 V2 区域检查
- 测试：235 tests 全部通过（205 已有 + 30 新增），lint + build 通过

### File List

**新增文件：**
- `src/utils/contextEnvelopeUtil.ts` — 待补齐项提取 + 完整性计算纯函数
- `src/hooks/useLaunchContext.ts` — 上下文补齐状态管理 hook
- `src/components/LaunchSession/ContextCompletionSection.tsx` — 上下文补齐表单 UI
- `tests/contextEnvelopeUtil.test.ts` — 工具函数测试（17 tests）
- `tests/contextCompletionSection.test.tsx` — 组件测试（13 tests）

**修改文件：**
- `src/types/launch.types.ts` — 新增 LaunchContextEnvelope, ContextCompleteness, SlotFillStatus, FillInItem
- `src/types/index.ts` — 导出新类型
- `src/utils/index.ts` — 导出 contextEnvelopeUtil 函数
- `src/hooks/useLaunchSession.ts` — LaunchSessionData 增加 workUnitId, snapshotId 字段
- `src/hooks/index.ts` — 导出 useLaunchContext
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — 删除 V2 占位，集成 ContextCompletionSection
- `tests/launchSessionComponent.test.tsx` — 更新 V2 占位测试为 V2 区域检查

**测试统计：** 235 tests（205 已有 + 30 V2 新增），全部通过。
