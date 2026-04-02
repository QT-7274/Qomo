# Story 2.1: V1 启动入口与对象选择

Status: done

## Story

作为一个在 VS Code 任务现场准备启动 AI 工作的 Qomo 用户，
我希望能快速进入启动入口，浏览并选择一个已有的 Work Unit 快照（支持手动选择与最近复用），
从而不再每次从零组织 Prompt，而是基于已设计好的工作单元直接开始任务。

## Acceptance Criteria

1. **启动入口可达**
   - Given 用户在 Web 应用中（模拟 VS Code 启动台场景），
   - When 用户点击顶部导航的"启动"入口或访问 `/launch` 路由，
   - Then 系统展示启动面板，列出可启动的 Work Unit 列表（FR49）。

2. **Work Unit 列表展示**
   - Given 启动面板已打开，
   - When 系统加载 Work Unit 列表，
   - Then 每个条目至少显示：名称、描述摘要、最近更新时间、交接准备状态（ready/partial/incomplete）、是否有可用快照（FR49）。

3. **手动选择 Work Unit**
   - Given 启动面板展示了 Work Unit 列表，
   - When 用户点击某个 Work Unit，
   - Then 系统加载该 Work Unit 的最新快照（若有），或当前编辑版本（若无快照），进入启动会话（FR50）。

4. **最近复用快速选择**
   - Given 启动面板已打开，且用户曾经选择过 Work Unit，
   - When 用户查看"最近使用"区域，
   - Then 显示最近 5 个被选择启动过的 Work Unit（按最近使用时间倒序），用户可一键选择复用（FR41、FR50）。

5. **搜索过滤**
   - Given 启动面板有多个 Work Unit，
   - When 用户在搜索框输入关键词，
   - Then Work Unit 列表按名称模糊匹配过滤，保持交互响应 ≤100ms（FR37、NFR2）。

6. **选中后进入启动会话**
   - Given 用户已选择一个 Work Unit（手动或最近复用），
   - When 选择完成，
   - Then 系统导航到启动会话页面 `/launch/:id`，展示该 Work Unit 的结构摘要（Slot/Capability/Constraint 概览），为后续 V2（上下文补齐）做入口准备。

7. **空状态与引导**
   - Given 用户没有任何 Work Unit，
   - When 进入启动面板，
   - Then 显示空状态引导，提示用户先在 Web 设计台创建 Work Unit，并提供返回列表的链接。

8. **快照优先原则**
   - Given 用户选择了一个有版本快照的 Work Unit，
   - When 系统加载数据，
   - Then 优先使用最新快照的冻结内容（不是当前编辑中的草稿），确保启动消费的是确定版本（W4 产出的核心语义）。

## Tasks / Subtasks

- [x] **任务 1：定义启动会话类型 + 最近使用记录** (AC: 3, 4, 6, 8)
  - [x] 在 `src/types/` 新增 `launch.types.ts`：定义 `LaunchSession`（sessionId, workUnitId, snapshotId?, selectedAt, status）和 `RecentLaunchRecord`（workUnitId, workUnitName, lastLaunchedAt）
  - [x] 在 `src/services/StorageService.ts` 升级 Dexie schema 到 version(6)：新增 `recentLaunches` 表（id, workUnitId, workUnitName, lastLaunchedAt），索引 `workUnitId, lastLaunchedAt`
  - [x] 实现 `recordRecentLaunch(workUnitId, workUnitName)` — 记录/更新最近使用，保持最多 10 条
  - [x] 实现 `listRecentLaunches(limit?)` — 按 lastLaunchedAt 倒序返回最近使用记录
  - [x] 实现 `getLatestSnapshot(workUnitId)` — 返回最新快照（基于已有 `listSnapshots` 取第一条）

- [x] **任务 2：StorageService 启动相关测试** (AC: 3, 4, 8)
  - [x] recordRecentLaunch 记录 + 更新已有记录
  - [x] listRecentLaunches 排序正确 + limit 生效
  - [x] 最近使用上限 10 条自动清理
  - [x] getLatestSnapshot 返回正确快照 / 无快照返回 undefined

- [x] **任务 3：useLaunchPanel Hook** (AC: 1, 2, 4, 5)
  - [x] 在 `src/hooks/` 新增 `useLaunchPanel.ts`
  - [x] 加载 Work Unit 列表（复用 `listWorkUnits`）+ 计算每个 WU 的 handoffStatus
  - [x] 加载最近使用列表（`listRecentLaunches`）
  - [x] 搜索过滤（客户端模糊匹配名称）
  - [x] 选择 Work Unit 的 handler（记录最近使用 + 加载快照/当前版本 + 返回 LaunchSession）

- [x] **任务 4：LaunchPanelComponent** (AC: 1, 2, 4, 5, 7)
  - [x] 在 `src/components/LaunchPanel/` 新增 `LaunchPanelComponent.tsx`
  - [x] 顶部：搜索框
  - [x] "最近使用"区域：水平卡片列表（最多 5 个），点击直接选择
  - [x] "所有 Work Unit"区域：垂直列表（名称、描述摘要、更新时间、交接状态徽章）
  - [x] 空状态：无 WU 时显示引导
  - [x] 点击 WU → 调用 hook.selectWorkUnit → 导航到 `/launch/:id`

- [x] **任务 5：LaunchSessionComponent（骨架）** (AC: 6)
  - [x] 在 `src/components/LaunchSession/` 新增 `LaunchSessionComponent.tsx`
  - [x] 接收 URL 参数 `:id`，加载 Work Unit + 快照
  - [x] 展示结构摘要：名称、描述、Slot 列表（名称+类型+必需性）、Constraint 数量、交接状态
  - [x] 底部提示"后续 V2 将在此补齐上下文"（占位）

- [x] **任务 6：路由更新** (AC: 1, 6)
  - [x] 在 `App.tsx` 新增路由 `/launch` → `LaunchPanelComponent`
  - [x] 新增路由 `/launch/:id` → `LaunchSessionComponent`
  - [x] 在 WorkUnitListComponent 顶部增加"启动台"导航链接

- [x] **任务 7：组件测试** (AC: 1-7)
  - [x] LaunchPanelComponent：列表渲染、搜索过滤、最近使用展示、空状态、点击选择
  - [x] LaunchSessionComponent：结构摘要渲染、快照优先加载

- [x] **任务 8：质量门槛** (AC: 1-8)
  - [x] `npm run lint && npm run build && npm test` 全过
  - [x] W4 的 181 个测试不能破

### Review Findings

- [x] [Review][Patch] recordRecentLaunch 清理排序 — 实际代码正确（使用 orderBy lastLaunchedAt），Blind Hunter 误报已验证
- [x] [Review][Patch] handleSelect 静默吞掉错误 — 已增加 selectError state 展示错误横幅
- [x] [Review][Patch] LaunchSessionComponent 直接调用 StorageService 违反分层架构 — 已提取 useLaunchSession hook
- [x] [Review][Patch] 快照 JSON 解析失败时静默回退 — useLaunchSession 增加结构校验 + snapshotWarning 展示
- [x] [Review][Patch] deleteWorkUnit 未级联清理 recentLaunches 表 — 已修复，事务内同时删除
- [x] [Review][Patch] 空状态判断缺陷 — 已修复为仅检查 workUnits.length === 0
- [x] [Review][Patch] LaunchSession 类型缺少 status 字段 — 已增加 LaunchSessionStatus + status 字段
- [x] [Review][Patch] formatRelativeTime 重复 — 已提取到 src/utils/formatUtil.ts，两个组件改为导入
- [x] [Review][Defer] selectWorkUnit 闭包捕获 stale 数据 — MVP 阶段单标签页使用可接受，后续需刷新机制
- [x] [Review][Defer] N+1 快照查询 — MVP 规模 (<100 WU) 可接受，后续需批量查询优化

## Dev Notes

### Developer Context

- **这是 Epic 2 的首个 story**，标志着从"Web 设计台"进入"启动台"体验。
- 前置已满足：B0-1（身份语义）+ W4（版本快照）+ 全部 Epic 1（结构编辑完整闭环）。
- **当前产品仍是 Web SPA**——V1 在 Web 内模拟"启动台"体验（新路由 `/launch`），为后续真正的 VS Code 扩展铺路。不要在本 story 中引入 VS Code extension 基础设施。
- V1 的核心价值：**让用户从"设计台"切换到"启动台"视角**，选择要使用的 Work Unit，体验"复用已有工作单元"而非"从零写 Prompt"。

### Technical Requirements

- **LaunchSession 类型设计**（轻量，不过度设计）：
  ```typescript
  interface LaunchSession {
    sessionId: string;         // 启动会话 ID
    workUnitId: string;        // 选中的 Work Unit
    snapshotId?: string;       // 使用的快照 ID（无快照则为 undefined）
    selectedAt: ISO8601;       // 选择时间
  }

  interface RecentLaunchRecord {
    id: string;                // 记录 ID（= workUnitId，单条记录）
    workUnitId: string;
    workUnitName: string;      // 冗余存储，避免 join
    lastLaunchedAt: ISO8601;
  }
  ```
- **Dexie schema v6**：新增 `recentLaunches` 表，索引 `id, workUnitId, lastLaunchedAt`
- **最近使用上限**：保留最多 10 条，超出时删除最旧的
- **快照优先**：`getLatestSnapshot()` 基于已有 `listSnapshots()` 取第一条（已按时间倒序）；若无快照则用当前 `WorkUnitRecord`
- **交接状态**：复用 `getHandoffReadiness()` 为每个 WU 计算 ready/partial/incomplete

### Architecture Compliance

- **分层严格遵守**：`Component → Hook → Service → Dexie`
  - `LaunchPanelComponent` 只调用 `useLaunchPanel` hook
  - `useLaunchPanel` 调用 `StorageService` 方法
  - 新的持久化操作（recentLaunches）只在 `StorageService` 中
- **命名规范**：
  - 组件：`LaunchPanelComponent.tsx`、`LaunchSessionComponent.tsx` → `src/components/`
  - Hook：`useLaunchPanel.ts` → `src/hooks/`
  - 类型：`launch.types.ts` → `src/types/`
  - 测试：`launchPanel.test.tsx`、`launchSession.test.tsx` → `tests/`
- **barrel exports**：更新 `src/types/index.ts`、`src/hooks/index.ts`、`src/components/index.ts`

### Library / Framework Requirements

- **不引入新依赖**——沿用已有：React 18, React Router, Dexie, Vitest, fake-indexeddb
- 导航用 `useNavigate()` + `useParams()`（已有模式）
- 交接状态用 `getHandoffReadiness()`（`src/utils/promptGeneratorUtil.ts`）

### File Structure Requirements

**新增文件：**
- `src/types/launch.types.ts` — LaunchSession + RecentLaunchRecord 类型
- `src/components/LaunchPanel/LaunchPanelComponent.tsx` — 启动面板 UI
- `src/components/LaunchPanel/index.ts` — barrel export
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — 启动会话骨架 UI
- `src/components/LaunchSession/index.ts` — barrel export
- `src/hooks/useLaunchPanel.ts` — 启动面板状态管理 hook
- `tests/launchStorageService.test.ts` — 最近使用 + 快照查询测试
- `tests/launchPanelComponent.test.tsx` — 启动面板组件测试
- `tests/launchSessionComponent.test.tsx` — 启动会话组件测试

**修改文件：**
- `src/services/StorageService.ts` — schema v6 + recentLaunches 表 + recordRecentLaunch / listRecentLaunches / getLatestSnapshot
- `src/components/App/App.tsx` — 新增 `/launch` 和 `/launch/:id` 路由
- `src/components/WorkUnitList/WorkUnitListComponent.tsx` — 增加"启动台"导航链接
- `src/types/index.ts` — 导出 launch.types
- `src/hooks/index.ts` — 导出 useLaunchPanel
- `src/components/index.ts` — 导出 LaunchPanel + LaunchSession

### Testing Requirements

- **StorageService**：recordRecentLaunch 新增/更新、listRecentLaunches 排序+limit、上限清理、getLatestSnapshot 有/无快照
- **LaunchPanelComponent**：列表渲染（名称+状态）、搜索过滤、最近使用区域、空状态引导、点击选择导航
- **LaunchSessionComponent**：结构摘要渲染、快照优先加载、无快照回退
- **回归**：W4 的 181 个测试不能破
- 交付前：`npm run lint && npm run build && npm test`

### Previous Story Intelligence

- **W4 快照模式**：`createSnapshot` / `listSnapshots` / `restoreSnapshot` 已在 StorageService 中，V1 的 `getLatestSnapshot` 直接复用 `listSnapshots` 取首条
- **Dexie schema 升级模式**：`.version(N).stores({...})` 链式调用，保留所有已有表的索引定义
- **UI 模式**：内联样式（style 对象）、中文 UI 文案、`formatRelativeTime()` 已在 WorkUnitListComponent 中可参考复用
- **Hook 模式**：`useWorkUnits` 的 fetch → filter → sort → render 模式可直接参考
- **测试模式**：`fake-indexeddb/auto` + `beforeEach` 清表 + `MemoryRouter` 包裹组件

### Git Intelligence

- 最近 15 个提交覆盖 W2a-W4，模式稳定：
  - Service 层先行（schema + CRUD）
  - Hook 层封装（状态管理 + 刷新）
  - Component 层 UI（内联样式 + 事件绑定）
  - 测试紧跟每个层
- 命名风格：`feat(v1):` 前缀

### References

- `_bmad-output/planning-artifacts/prd.md` — FR37（搜索）、FR41（使用频率）、FR49-FR50（VS Code 列表+启动）、NFR2（响应 ≤100ms）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — V1 定义（第 3497 行）、最小 AC（第 3588 行）、依赖语义（第 3534 行）
- `src/services/StorageService.ts` — 已有 listWorkUnits / listSnapshots / WorkUnitVersionRecord
- `src/utils/promptGeneratorUtil.ts` — getHandoffReadiness / HandoffStatus
- `src/hooks/useWorkUnits.ts` — 列表 hook 模式参考
- `src/components/WorkUnitList/WorkUnitListComponent.tsx` — UI 模式 + formatRelativeTime 参考
- `CLAUDE.md` — 分层架构、命名规范、双 schema 版本

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- 本故事由 `dev-story` 工作流实现。
- 目标 story：`v1-launch-entry-and-object-selection`（Epic 2 首个 story）
- Dexie schema 升级到 version(6)，新增 `recentLaunches` 表
- 新增 3 个 StorageService 方法：recordRecentLaunch / listRecentLaunches / getLatestSnapshot
- 新增 useLaunchPanel hook：列表加载 + 交接状态计算 + 最近使用 + 搜索 + 选择
- 新增 LaunchPanelComponent：启动面板 UI（搜索 + 最近使用 + WU 列表 + 空状态）
- 新增 LaunchSessionComponent：启动会话骨架（结构摘要 + 快照优先 + V2 占位）
- 路由新增 `/launch` 和 `/launch/:id`，设计台列表增加"启动台"导航
- 测试：205 tests 全部通过（181 已有 + 24 新增），lint + build 通过

### File List

**新增文件：**
- `src/types/launch.types.ts` — LaunchSession + RecentLaunchRecord 类型
- `src/components/LaunchPanel/LaunchPanelComponent.tsx` — 启动面板 UI
- `src/components/LaunchPanel/index.ts` — barrel export
- `src/components/LaunchSession/LaunchSessionComponent.tsx` — 启动会话骨架 UI
- `src/components/LaunchSession/index.ts` — barrel export
- `src/hooks/useLaunchPanel.ts` — 启动面板状态管理 hook
- `tests/launchStorageService.test.ts` — 最近使用 + 快照查询测试（9 tests）
- `tests/launchPanelComponent.test.tsx` — 启动面板组件测试（8 tests）
- `tests/launchSessionComponent.test.tsx` — 启动会话组件测试（7 tests）

**修改文件：**
- `src/services/StorageService.ts` — schema v6 + recentLaunches 表 + recordRecentLaunch / listRecentLaunches / getLatestSnapshot
- `src/components/App/App.tsx` — 新增 `/launch` 和 `/launch/:id` 路由
- `src/components/WorkUnitList/WorkUnitListComponent.tsx` — 增加"启动台"导航链接
- `src/types/index.ts` — 导出 launch.types
- `src/hooks/index.ts` — 导出 useLaunchPanel
- `src/components/index.ts` — 导出 LaunchPanel + LaunchSession

**测试统计：** 205 tests（181 已有 + 24 V1 新增），全部通过。
