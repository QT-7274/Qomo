# Story 2.3: V3a capability 可用性总览

Status: done

## Story

作为一个已补齐启动上下文的 Qomo 用户，
我希望在 `/launch/:id` 页面看到当前 Work Unit 中每个声明 Capability 的可用性状态（ready / blocked / ambiguous），
从而在启动前知道哪些能力已就绪、哪些有问题需要处理。

## Acceptance Criteria

1. **CapabilityAvailability 状态计算**
   - Given 用户已进入启动会话且 Work Unit 有 Slot/Capability 结构，
   - When 系统分析每个 Capability 的声明与当前 runtime 环境，
   - Then 为每个 Capability 生成一个可用性状态：
     - `ready`：能力可用，无问题
     - `missing`：能力缺失
     - `version_incompatible`：版本不兼容
     - `permission_denied`：权限不足
     - `ambiguous_candidate`：存在多个候选，需用户选择
   - （FR78-FR80）

2. **总览面板展示**
   - Given 可用性状态已计算，
   - When 用户在启动会话页面查看能力总览区域，
   - Then 显示三个分组：
     - ✅ **已就绪**（ready）：已匹配能力列表，默认折叠
     - ❌ **阻塞**（missing / version_incompatible / permission_denied）：问题能力列表，展开显示
     - ⚠️ **待决**（ambiguous_candidate）：需用户选择的能力列表，展开显示
   - 每个分组显示数量徽章（如"已就绪 3 · 阻塞 1 · 待决 2"）
   - （FR81）

3. **每项能力显示最小信息**
   - Given 能力总览已展示，
   - When 用户查看某个能力条目，
   - Then 至少显示：
     - Capability 名称
     - 所属 Slot 名称
     - 可用性状态图标与文案
     - 问题类型（如有）
   - （FR82）

4. **无 Capability 空态**
   - Given Work Unit 的所有 Slot 都没有挂载 Capability，
   - When 系统计算可用性，
   - Then 显示"当前无声明能力"提示，不显示总览面板。

5. **全部就绪时的正向确认**
   - Given 所有 Capability 均为 ready 状态，
   - When 用户查看能力总览，
   - Then 显示"✅ 所有能力均已就绪"的正向确认信息，无阻塞/待决分组。

6. **模拟判定策略（Web SPA 阶段）**
   - Given 当前仍为 Web SPA 无法做真实 runtime capability discovery（FR74-FR76），
   - When 系统判断 Capability 可用性，
   - Then 采用 **基于 Capability 内容的模拟判定**：
     - 有 `content`（非空文本）→ `ready`
     - 无 `content`（空字符串）→ `missing`
   - 模拟策略在 util 层隔离，后续 VS Code 扩展只需替换判定实现。

7. **CapabilityAvailability 数据结构**
   - Given 系统完成可用性判断，
   - When 查看内存中的 availability 列表，
   - Then 每项包含：
     - `capabilityId`：能力 ID
     - `capabilityName`：能力名称
     - `slotId`：所属 Slot ID
     - `slotName`：所属 Slot 名称
     - `status`：可用性状态（AvailabilityStatus 枚举）
     - `issueType`：问题类型（与 B0-2 CapabilityIssue.issueType 复用同一枚举）
     - `description`：问题描述（可选）

8. **总览统计作为 V4 决策输入**
   - Given 可用性计算完成，
   - When 下游查看 availability 汇总，
   - Then 提供 `readyCount` / `blockedCount` / `ambiguousCount` 统计，供 V4 判断是否可直接继续启动。

## Tasks / Subtasks

- [x] **任务 1：定义 CapabilityAvailability 类型** (AC: 1, 7)
  - [x] 在 `src/types/` 新增 `capabilityAvailability.types.ts`
  - [x] 定义 `AvailabilityStatus` 枚举：`'ready' | 'missing' | 'version_incompatible' | 'permission_denied' | 'ambiguous_candidate'`
  - [x] 定义 `CapabilityAvailabilityItem` 接口：capabilityId, capabilityName, slotId, slotName, status, issueType?, description?
  - [x] 定义 `AvailabilitySummary` 接口：readyCount, blockedCount, ambiguousCount, items
  - [x] 更新 `src/types/index.ts` barrel export

- [x] **任务 2：可用性判定工具函数** (AC: 1, 6, 8)
  - [x] 在 `src/utils/` 新增 `capabilityAvailabilityUtil.ts`
  - [x] 实现 `assessCapabilityAvailability(slots: Slot[]): CapabilityAvailabilityItem[]` — 遍历所有 Slot 的 Capability，按模拟策略判定可用性
  - [x] 实现 `summarizeAvailability(items: CapabilityAvailabilityItem[]): AvailabilitySummary` — 计算三类统计
  - [x] 模拟判定逻辑隔离：content 非空 → ready，content 空 → missing
  - [x] 更新 `src/utils/index.ts` barrel export

- [x] **任务 3：工具函数测试** (AC: 1, 4, 5, 6, 8)
  - [x] assessCapabilityAvailability：有 content → ready / 无 content → missing
  - [x] assessCapabilityAvailability：无 Capability 的 Slot 不产生 item
  - [x] assessCapabilityAvailability：空 slots 返回空数组
  - [x] summarizeAvailability：正确统计 ready/blocked/ambiguous 数量
  - [x] summarizeAvailability：空列表返回全零

- [x] **任务 4：useCapabilityAvailability Hook** (AC: 1, 2, 8)
  - [x] 在 `src/hooks/` 新增 `useCapabilityAvailability.ts`
  - [x] 接收 `slots: Slot[]` 参数
  - [x] 暴露 `items`, `summary`, `allReady` 计算值
  - [x] 更新 `src/hooks/index.ts` barrel export

- [x] **任务 5：CapabilityOverviewSection 组件** (AC: 2, 3, 4, 5)
  - [x] 在 `src/components/LaunchSession/` 新增 `CapabilityOverviewSection.tsx`（子组件）
  - [x] 顶部：统计摘要（已就绪 X · 阻塞 Y · 待决 Z）
  - [x] 全部就绪时：正向确认"✅ 所有能力均已就绪"
  - [x] 阻塞分组：展开显示问题列表（名称 + Slot + 状态 + 问题类型）
  - [x] 待决分组：展开显示候选歧义列表
  - [x] 已就绪分组：默认折叠，可展开查看
  - [x] 无 Capability 空态提示

- [x] **任务 6：集成到 LaunchSessionComponent** (AC: 2)
  - [x] 在 `LaunchSessionComponent` 中引入 `useCapabilityAvailability` + `CapabilityOverviewSection`
  - [x] 放置在 V2 上下文补齐区域之后
  - [x] 传递 `data.slots` 到 hook

- [x] **任务 7：组件测试** (AC: 2-5)
  - [x] CapabilityOverviewSection：三分组渲染（ready/blocked/ambiguous）
  - [x] CapabilityOverviewSection：全部就绪正向确认
  - [x] CapabilityOverviewSection：无 Capability 空态
  - [x] CapabilityOverviewSection：统计摘要数量正确
  - [x] LaunchSessionComponent：能力总览区域存在

- [x] **任务 8：质量门槛** (AC: 1-8)
  - [x] `npm run lint && npm run build && npm test` 全过
  - [x] V2 的 244 个测试不能破

## Dev Notes

### Developer Context

- **这是 Epic 2 的第三个 story**，依赖 B0-2（决策词汇）+ V2（上下文补齐）。
- V3a 的核心：为每个 Capability 计算可用性状态，展示 ready / blocked / ambiguous 三分组总览。
- **当前仍为 Web SPA**，无法做真实 runtime capability discovery（FR74-FR76），采用模拟判定策略：content 非空 → ready，content 空 → missing。
- V3a 产出的 `AvailabilitySummary` 是后续 V3b（阻塞解释）/ V3c（歧义解释）/ V4（用户决策）的直接输入。
- **复用 B0-2 类型**：`CapabilityIssue.issueType`（decision.types.ts）已定义 `'missing' | 'version_incompatible' | 'permission_denied' | 'ambiguous_candidate'`，V3a 的 `AvailabilityStatus` 扩展一个 `'ready'` 值。
- 不持久化——与 V2 一样，数据纯内存。

### Technical Requirements

- **AvailabilityStatus 类型设计**：
  ```typescript
  /** 可用性状态（扩展 B0-2 issueType + ready） */
  type AvailabilityStatus = 'ready' | 'missing' | 'version_incompatible' | 'permission_denied' | 'ambiguous_candidate';

  interface CapabilityAvailabilityItem {
    readonly capabilityId: string;
    readonly capabilityName: string;
    readonly slotId: string;
    readonly slotName: string;
    status: AvailabilityStatus;
    issueType?: CapabilityIssue['issueType'];  // 复用 B0-2
    description?: string;
  }

  interface AvailabilitySummary {
    readonly readyCount: number;
    readonly blockedCount: number;    // missing + version_incompatible + permission_denied
    readonly ambiguousCount: number;  // ambiguous_candidate
    readonly items: readonly CapabilityAvailabilityItem[];
  }
  ```
- **模拟判定策略**（Web SPA 阶段）：
  ```typescript
  function assessSingleCapability(cap, slot): CapabilityAvailabilityItem {
    const status = cap.content.trim().length > 0 ? 'ready' : 'missing';
    return { capabilityId: cap.id, capabilityName: cap.name,
             slotId: slot.id, slotName: slot.name, status,
             issueType: status === 'missing' ? 'missing' : undefined };
  }
  ```
- **blocked 定义**：`missing` + `version_incompatible` + `permission_denied` 统一归入 blocked 分组

### Architecture Compliance

- **分层**：`Component → Hook → Util`（与 V2 一致）
  - `CapabilityOverviewSection` 只调用 `useCapabilityAvailability` hook
  - `useCapabilityAvailability` 调用 `capabilityAvailabilityUtil` 纯函数
  - 不涉及 Service/Dexie 层
- **命名规范**：
  - 类型：`capabilityAvailability.types.ts` → `src/types/`
  - Util：`capabilityAvailabilityUtil.ts` → `src/utils/`
  - Hook：`useCapabilityAvailability.ts` → `src/hooks/`
  - 组件：`CapabilityOverviewSection.tsx` → `src/components/LaunchSession/`（子组件）
  - 测试：`capabilityAvailabilityUtil.test.ts`、`capabilityOverviewSection.test.tsx` → `tests/`
- **barrel exports**：更新 types/index.ts, utils/index.ts, hooks/index.ts

### Library / Framework Requirements

- **不引入新依赖**——沿用已有：React 18, Vitest, @testing-library/react
- 内联样式（项目约定）

### File Structure Requirements

**新增文件：**
- `src/types/capabilityAvailability.types.ts` — AvailabilityStatus, CapabilityAvailabilityItem, AvailabilitySummary
- `src/utils/capabilityAvailabilityUtil.ts` — 判定 + 汇总纯函数
- `src/hooks/useCapabilityAvailability.ts` — 可用性状态管理 hook
- `src/components/LaunchSession/CapabilityOverviewSection.tsx` — 能力总览 UI
- `tests/capabilityAvailabilityUtil.test.ts` — 工具函数测试
- `tests/capabilityOverviewSection.test.tsx` — 组件测试

**修改文件：**
- `src/types/index.ts` — 导出新类型
- `src/utils/index.ts` — 导出新函数
- `src/hooks/index.ts` — 导出新 hook
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — 集成 CapabilityOverviewSection

### Testing Requirements

- **capabilityAvailabilityUtil**：content 非空→ready / 空→missing、无 Capability Slot 跳过、空 slots、summarize 统计
- **CapabilityOverviewSection**：三分组渲染、全部就绪正向确认、无 Capability 空态、统计数量
- **LaunchSessionComponent**：能力总览区域存在
- **回归**：V2 的 244 个测试不能破
- 交付前：`npm run lint && npm run build && npm test`

### Previous Story Intelligence

- **V2 代码模式**：
  - `contextEnvelopeUtil.ts` 纯函数 → hook 消费 → 组件渲染的三层模式
  - Review 修复了全局布尔问题，V3a 应从一开始按每个 Capability 逐项判定
  - `ContextCompletionSection` 作为 LaunchSession 子组件的模式可复用
- **B0-2 类型**（decision.types.ts）：
  - `CapabilityIssue.issueType`: `'missing' | 'version_incompatible' | 'permission_denied' | 'ambiguous_candidate'` — V3a 直接复用
  - `DecisionContext.issues`: `CapabilityIssue[]` — V3a 产出可直接喂入 V4 决策
- **内联样式模式**：全项目使用 React `CSSProperties` 对象
- **测试模式**：纯函数直接 import 测试；组件用 `render` + `screen` + `cleanup`

### Git Intelligence

- 最近 commit：`feat(v2)` 模式
- V3a 应使用 `feat(v3a):` 前缀

### References

- `docs/analysis/product-brief-Qomo-2025-12-27.md` — V3a 定义（第 3499 行）、最小 AC（第 3590 行）、CapabilityAvailability 数据模型（第 2012-2027 行）、能力可用性反馈统一口径（第 1783-1812 行）
- `_bmad-output/planning-artifacts/prd.md` — FR74-FR82（能力发现 + 可用性展示）
- `src/types/decision.types.ts` — CapabilityIssue（issueType 枚举）、DecisionContext
- `src/types/capability.types.ts` — Capability（id, name, content, order）
- `src/types/slot.types.ts` — Slot（含 capabilities: Capability[]）
- `src/utils/contextEnvelopeUtil.ts` — V2 纯函数模式参考
- `src/hooks/useLaunchContext.ts` — V2 hook 模式参考
- `src/components/LaunchSession/ContextCompletionSection.tsx` — V2 子组件模式参考
- `CLAUDE.md` — 分层架构、命名规范

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- 本故事由 `dev-story` 工作流实现。
- 目标 story：`v3a-capability-availability-overview`（Epic 2 第三个 story）
- 新增 3 个类型：AvailabilityStatus, CapabilityAvailabilityItem, AvailabilitySummary
- 新增 capabilityAvailabilityUtil.ts：2 个纯函数（assessCapabilityAvailability, summarizeAvailability）
- 模拟判定策略：content 非空 → ready，content 空 → missing（Web SPA 阶段隔离）
- 新增 useCapabilityAvailability hook：items, summary, allReady
- 新增 CapabilityOverviewSection 组件：三分组（ready/blocked/ambiguous）+ 统计摘要 + 全部就绪确认 + 空态
- 集成到 LaunchSessionComponent：V2 上下文补齐区域之后
- 测试：264 tests 全部通过（244 已有 + 20 新增），lint + build 通过

### File List

**新增文件：**
- `src/types/capabilityAvailability.types.ts` — AvailabilityStatus, CapabilityAvailabilityItem, AvailabilitySummary
- `src/utils/capabilityAvailabilityUtil.ts` — 判定 + 汇总纯函数
- `src/hooks/useCapabilityAvailability.ts` — 可用性状态 hook
- `src/components/LaunchSession/CapabilityOverviewSection.tsx` — 能力总览 UI
- `tests/capabilityAvailabilityUtil.test.ts` — 工具函数测试（11 tests）
- `tests/capabilityOverviewSection.test.tsx` — 组件测试（9 tests）

**修改文件：**
- `src/types/index.ts` — 导出新类型
- `src/utils/index.ts` — 导出新函数
- `src/hooks/index.ts` — 导出新 hook
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — 集成 CapabilityOverviewSection

**测试统计：** 264 tests（244 已有 + 20 V3a 新增），全部通过。
