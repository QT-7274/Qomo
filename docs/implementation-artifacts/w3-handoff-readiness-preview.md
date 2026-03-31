# Story W3: 交接准备预览

Status: done

## Story

作为一个在 Web 设计台中定义 AI 工作方式的 Qomo 用户，
我希望在离开 Web 前能看到一个完整的 Prompt 预览文本、待补齐摘要、和准备状态，
从而让我知道"什么已准备好可以交给 VS Code、什么还要到现场补齐"，避免带着不完整的对象进入启动。

## Acceptance Criteria

1. **生成完整 Prompt 预览文本**
   - Given 用户在 Work Unit 详情页，
   - When 用户点击"预览"，
   - Then 系统基于 Work Unit 的 Slot/Capability 结构和约束包，生成一段结构化 Prompt 文本（FR23、FR24）。

2. **预览文本包含所有结构**
   - Given Work Unit 有 Slot、Capability、约束包，
   - When 系统生成预览，
   - Then 预览文本按 Slot 分段、每段包含其下 Capability 内容、最后附约束包内容（FR15、FR22）。

3. **标记未填项**
   - Given Work Unit 有待补齐 Slot（fillIn 声明），
   - When 系统生成预览，
   - Then 待补齐 Slot 在预览文本中以占位符标记（如 `[待补齐: {slot名称}]`），并在预览区旁显示未填项列表（FR27）。

4. **复制预览文本**
   - Given 预览已生成，
   - When 用户点击"复制"按钮，
   - Then 完整 Prompt 文本被复制到剪贴板，用户看到反馈提示（FR25）。

5. **下载预览文本**
   - Given 预览已生成，
   - When 用户点击"下载"按钮，
   - Then 下载为 `.txt` 文件，文件名包含 Work Unit 名称（FR26）。

6. **交接准备状态**
   - Given 用户查看 Work Unit 详情页，
   - When 查看交接准备区域，
   - Then 显示三种状态之一：✅ 可交接（无待补齐必需项）、⚠️ 部分准备（有非必需待补齐项）、❌ 需完善（有必需 Slot 为空或有必需待补齐项）。

7. **空内容阻止导出**
   - Given Work Unit 无任何 Slot 或所有 Capability 内容为空，
   - When 用户尝试复制或下载，
   - Then 显示"内容为空，无法导出"提示，按钮禁用。

## Tasks / Subtasks

- [ ] **任务 1：定义 Prompt 生成工具函数** (AC: 1, 2, 3, 7)
  - [ ] 在 `src/utils/` 新增 `promptGeneratorUtil.ts`
  - [ ] 实现 `generatePromptPreview(workUnit: WorkUnitRecord): string` — 遍历 Slot → Capability → Constraint，拼接为结构化文本
  - [ ] 待补齐 Slot 输出占位符 `[待补齐: {name}]`
  - [ ] 实现 `getHandoffReadiness(workUnit: WorkUnitRecord): HandoffStatus` — 计算交接准备状态
  - [ ] 定义 `HandoffStatus` 类型（`'ready' | 'partial' | 'incomplete'`）

- [ ] **任务 2：Prompt 生成工具函数测试** (AC: 1-3, 6, 7)
  - [ ] 测试空 Work Unit 返回空字符串
  - [ ] 测试有 Slot/Capability 时生成正确结构
  - [ ] 测试约束包出现在末尾
  - [ ] 测试待补齐 Slot 输出占位符
  - [ ] 测试交接准备状态三种情况
  - [ ] 测试全空内容判定

- [ ] **任务 3：预览面板 UI** (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] 在 `WorkUnitDetailComponent` 中，在待补齐摘要之后增加"预览与交接"区域
  - [ ] 显示交接准备状态标签
  - [ ] 点击"生成预览"按钮后，在 `<pre>` 区域展示生成的 Prompt 文本
  - [ ] "复制"按钮调用 `navigator.clipboard.writeText()`
  - [ ] "下载"按钮通过 `<a>` + Blob 触发 `.txt` 下载
  - [ ] 空内容时按钮禁用 + 提示文本

- [ ] **任务 4：预览面板 UI 测试** (AC: 1, 4, 5, 6, 7)
  - [ ] 渲染测试：交接准备状态显示
  - [ ] 渲染测试：生成预览后文本可见
  - [ ] 渲染测试：空 Work Unit 按钮禁用
  - [ ] 回归：W2c 的 150 个测试不能破

- [ ] **任务 5：测试与质量门槛** (AC: 1-7)
  - [ ] 确保 `npm run lint`、`npm run build`、`npm test` 全部通过
  - [ ] 记录测试统计

## Dev Notes

### Developer Context

- 这是 Epic 1 的第五个 story，依赖 W2a + W2b + W2c。
- W2a 已建立：`Slot`（name, slotType, description, required, capabilities）、`Capability`（name, content, order）
- W2b 已建立：`ConstraintPack`（name, constraintType, content, order, outputFormat?, lengthLimit?, checklistItems?）
- W2c 已建立：`FillInDeclaration`（method, hint?）、Slot.fillIn 可选字段
- 当前 Work Unit 完整结构：`WorkUnitRecord { id, name, description, sourceType, slots: Slot[], constraints: ConstraintPack[], createdAt, updatedAt }`
- W3 的核心任务是**基于已有结构生成 Prompt 预览和交接准备状态**，是只读消费层，不修改数据模型。
- W4（版本化快照）依赖 W3。

### Technical Requirements

- **Prompt 生成逻辑**：
  - 按 Slot 排列（数组顺序），每个 Slot 一段
  - 每段标题：`## {slot.name}（{slotTypeLabel}）`
  - 如果 Slot 有 fillIn 声明，标题后附加 `[待补齐: {slot.name}]`
  - 每段正文：该 Slot 下按 order 排列的 Capability 内容，换行拼接
  - 最后一段：约束包（按 order 排列），每个约束 `### {name}（{typeLabel}）\n{content}`
  - 输出格式约束额外附加：`格式要求: {formatLabel}`、`长度限制: {min?}-{max?} {unitLabel}`
  - 质量检查清单额外附加检查项列表
- **HandoffStatus 计算**：
  - `ready`：无 required 的 Slot 为空（至少有一个 Capability），无 fillIn 声明的 required Slot
  - `partial`：有 fillIn 声明但都不在 required Slot 上
  - `incomplete`：有 required Slot 无 Capability，或有 required Slot 带 fillIn 声明
- **工具函数放 `src/utils/`**：纯函数，不调用 Service 或 Hook，输入 `WorkUnitRecord` 输出 `string` 或 `HandoffStatus`
- **复制使用 `navigator.clipboard.writeText()`**：浏览器原生 API
- **下载使用 Blob + 动态 `<a>`**：无需第三方库
- **不引入 Zod**：保持一致

### Architecture Compliance

- 分层：工具函数在 `src/utils/`，UI 在 `src/components/`
- `promptGeneratorUtil.ts` 是纯函数，不触碰 Dexie 或任何 side effect
- 组件通过 import 直接使用工具函数（不经过 Hook，因为是纯计算）
- 命名遵循 `docs/mault.yaml`：`*Util*.ts`、`*Component.tsx`

### Library / Framework Requirements

- 沿用已有依赖，**不引入新依赖**
- 复制用 `navigator.clipboard.writeText()`
- 下载用 `URL.createObjectURL(new Blob(...))`

### File Structure Requirements

- 新增/修改文件方向：
  - `src/utils/promptGeneratorUtil.ts` — Prompt 生成 + 交接准备状态计算（新增）
  - `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 修改：增加预览与交接区域
  - `tests/promptGeneratorUtil.test.ts` — 新增：Prompt 生成 + 状态计算测试
  - `tests/workUnitDetailComponent.test.tsx` — 修改：增加预览面板渲染测试

### Testing Requirements

- 复用 Vitest + @testing-library/react + fake-indexeddb
- 测试重点：
  - **promptGeneratorUtil**：空 WU、有结构 WU、含 fillIn 占位符、约束包渲染、交接状态三种值
  - **WorkUnitDetailComponent**：交接状态标签显示、预览文本展示、空内容禁用
  - **回归**：W2c 的 150 个测试不能破
- 交付前必须通过：`npm run lint`、`npm run build`、`npm test`

### Previous Story Intelligence

- **W2a/W2b/W2c 建立的模式（必须沿用）**：
  - `StorageService` 嵌套 JSON 模式
  - 组件用内联 `React.CSSProperties` 样式
  - 标签用 `<span style={tagStyle}>` 模式
  - 测试用 `beforeEach` 清空数据库 + `MemoryRouter`
  - 区域标题用 `sectionHeaderStyle` 模式
- **W2c 新增模式**：
  - 待补齐摘要区域已存在于组件中（`fillInSlots` 计算），W3 的交接状态可复用该逻辑
  - `fillInMethodLabels` 和 `fillInMethodOptions` 常量已定义
- **关键注意**：
  - W3 是只读预览，不写数据，不升 schema
  - Prompt 生成是纯函数，应放 `src/utils/` 而非 Service

### References

- `_bmad-output/planning-artifacts/prd.md` — FR15（Slot/Capability 组合预览）、FR22（约束预览）、FR23-FR26（Prompt 预览与导出）、FR27（占位符检测）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — W3 定义（第 3485 行）、最小 AC（第 3581 行）、预览与交接面板（第 1540-1542 行）、交接准备状态（第 1704 行）
- `docs/implementation-artifacts/w2c-runtime-fill-ins-semantics-declaration.md` — W2c 完成记录、fillIn 结构
- `docs/implementation-artifacts/w2b-constraint-and-output-semantics-declaration.md` — W2b 完成记录、约束结构
- `CLAUDE.md` — 导出三路径（copy → download .txt → select-all）、export_denied 必须有兜底

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- 本故事文件由 `create-story` 工作流生成。
- 目标 story：`w3-handoff-readiness-preview`
- 实施由 subagent-driven-development 完成，2 个实施任务 + 1 个验证任务。

### File List

**新增文件：**
- `src/utils/promptGeneratorUtil.ts` — Prompt 预览生成 + 交接准备状态计算（generatePromptPreview + getHandoffReadiness）
- `tests/promptGeneratorUtil.test.ts` — 工具函数测试（13 tests）

**修改文件：**
- `src/utils/index.ts` — 新增 generatePromptPreview / getHandoffReadiness / HandoffStatus barrel export
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 增加预览与交接面板（生成预览 + 复制 + 下载 + 交接状态标签）
- `tests/workUnitDetailComponent.test.tsx` — 增加预览面板渲染测试（+4 tests）

**测试统计：** 167 tests（W2c 的 150 + W3 新增 17），全部通过。
