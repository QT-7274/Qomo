# Story W4: 版本化快照与继续编辑连续性

Status: done

## Story

作为一个在 Web 设计台中定义 AI 工作方式的 Qomo 用户，
我希望能为 Work Unit 创建可被 VS Code 启动的确定版本快照，查看版本历史，恢复历史版本，
从而让我的 Work Unit 有明确的版本语义，VS Code 消费的是确定快照而非模糊草稿，同时我可以继续修订。

## Acceptance Criteria

1. **创建版本快照**
   - Given 用户在 Work Unit 详情页，
   - When 点击"创建快照"，
   - Then 系统将当前 Work Unit 的完整结构（Slot/Capability/Constraint/FillIn）序列化并冻结为一个不可变版本记录，记录版本号、时间和内容哈希（FR6、FR44）。

2. **查看版本历史**
   - Given Work Unit 已有至少一个快照，
   - When 用户在详情页查看版本历史区域，
   - Then 显示快照列表（按时间倒序），每条显示版本号、创建时间、是否为当前版本（FR45）。

3. **恢复历史版本**
   - Given 用户查看版本历史列表，
   - When 点击某个历史版本的"恢复"按钮并确认，
   - Then 当前 Work Unit 的结构被替换为该快照的内容，sourceType 设为 `restored_from`，updatedAt 刷新（FR47）。

4. **版本限制与清理**
   - Given 快照数量超过 5 个，
   - When 创建新快照时，
   - Then 自动删除最旧的快照，保持最多 5 个（FR48、NFR45）。

5. **快照内容哈希**
   - Given 创建快照时，
   - When 系统序列化 Work Unit 结构，
   - Then 生成内容哈希，可用于后续判断"当前编辑是否与最近快照有差异"。

6. **VS Code 可消费**
   - Given V1 依赖 W4 产出的快照，
   - When 后续 Story 读取 Work Unit 快照，
   - Then 快照结构稳定、包含完整 Slot/Capability/Constraint/FillIn 内容、可被序列化为 JSON。

## Tasks / Subtasks

- [ ] **任务 1：定义快照存储类型 + 扩展 StorageService** (AC: 1, 4, 5)
  - [ ] 在 StorageService 中定义 `WorkUnitVersionRecord` 接口（snapshotId, workUnitId, versionNumber, contentHash, content JSON, createdAt）
  - [ ] 升级 Dexie schema 到 version(5)：新增 `workUnitVersions` 表
  - [ ] 实现 `createSnapshot(workUnitId)` — 序列化当前 WU 结构，计算哈希，存入版本表，超过 5 个自动清理最旧
  - [ ] 实现 `listSnapshots(workUnitId)` — 按时间倒序返回版本列表
  - [ ] 实现 `restoreSnapshot(workUnitId, snapshotId)` — 用快照内容覆盖当前 WU 结构

- [ ] **任务 2：快照 StorageService 测试** (AC: 1-5)
  - [ ] 创建快照 + 验证结构
  - [ ] 列表按时间倒序
  - [ ] 恢复快照覆盖当前内容
  - [ ] 超过 5 个自动清理
  - [ ] 内容哈希一致性

- [ ] **任务 3：版本历史 UI** (AC: 1, 2, 3)
  - [ ] 在 WorkUnitDetailComponent 增加"版本历史"区域（在预览与交接之后）
  - [ ] "创建快照"按钮
  - [ ] 版本列表（版本号、时间、恢复按钮）
  - [ ] 恢复确认（window.confirm）

- [ ] **任务 4：版本历史 UI 测试** (AC: 1, 2, 3)
  - [ ] 渲染测试 + 交互测试

- [ ] **任务 5：质量门槛** (AC: 1-6)
  - [ ] lint + build + test 全过

## Dev Notes

### Developer Context

- 这是 Epic 1 的最后一个 story，依赖 B0-1 + W3。
- B0-1 已定义 `WorkUnitSnapshot`（identity + snapshot + lineage）、`SnapshotIdentity`（snapshotId, versionId, versionNumber, contentHash, previousVersionId）和 Helper 函数。
- **但 B0-1 的 `WorkUnitSnapshot` 是语义 contract 类型**（用于跨端引用），不是持久化版本记录。W4 需要一个更实用的版本存储记录。
- W4 的核心任务：在 IndexedDB 中建立版本历史表，存储 Work Unit 的完整结构快照。
- 当前 `WorkUnitRecord` 包含：`id, name, description, sourceType, slots[], constraints[], createdAt, updatedAt`。
- 快照要存储的内容：序列化的 `{ name, description, slots, constraints }` JSON + 内容哈希。

### Technical Requirements

- **WorkUnitVersionRecord 设计**：
  ```
  {
    id: string,               // 快照唯一 ID
    workUnitId: string,        // 所属 Work Unit
    versionNumber: number,     // 自增版本号（1, 2, 3...）
    contentHash: string,       // JSON 内容的简单哈希
    content: string,           // JSON.stringify({ name, description, slots, constraints })
    createdAt: ISO8601         // 创建时间
  }
  ```
- **Dexie schema v5**：新增 `workUnitVersions` 表，索引 `id, workUnitId, createdAt`
- **版本号**：单调自增整数（不用 semver），从 1 开始
- **内容哈希**：用简单字符串哈希（不需要 crypto SHA-256），用于快速比较
- **版本上限**：最多保留 5 个快照，创建新快照时自动删除最旧的
- **恢复逻辑**：用快照 content JSON 覆盖当前 WU 的 name/description/slots/constraints，刷新 updatedAt

### Architecture Compliance

- 分层：`Component → Hook → Service → Dexie`
- 新表 `workUnitVersions` 在同一个 `QomoDatabase` 中
- 所有持久化走 `StorageService`，事务内完成
- 类型定义在 StorageService 文件内（与 `WorkUnitRecord` 同级，因为是持久化记录）

### Library / Framework Requirements

- 沿用已有依赖，**不引入新依赖**
- 哈希用简单的 JS 字符串哈希函数（非 crypto）

### File Structure Requirements

- `src/services/StorageService.ts` — 修改：schema v5 + WorkUnitVersionRecord + createSnapshot/listSnapshots/restoreSnapshot
- `src/hooks/useWorkUnitEditor.ts` — 修改：增加 createSnapshot/listSnapshots/restoreSnapshot 方法
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 修改：增加版本历史区域
- `tests/storageService.test.ts` — 修改：快照测试
- `tests/workUnitDetailComponent.test.tsx` — 修改：版本历史 UI 测试

### Testing Requirements

- **StorageService**：createSnapshot 结构验证、listSnapshots 排序、restoreSnapshot 覆盖、版本上限清理、哈希一致性
- **WorkUnitDetailComponent**：创建快照按钮、版本列表展示、恢复交互
- **回归**：W3 的 167 个测试不能破
- 交付前：`npm run lint && npm run build && npm test`

### Previous Story Intelligence

- **W2a/W2b/W2c/W3 沿用模式**：Dexie 事务、hook 封装、内联样式、window.confirm 确认、MemoryRouter 测试
- **B0-1 已有 Helper**：`createSnapshotIdentity()`、`formatSnapshotId()` 等可参考但不强制使用——W4 的存储记录更实用
- **StorageService 现有模式**：schema 升级用 `.version(N).stores({...}).upgrade(...)` 链

### References

- `_bmad-output/planning-artifacts/prd.md` — FR6-FR7（版本保存与恢复）、FR44-FR48（版本历史管理）、NFR45（最近 5 个版本）
- `docs/analysis/product-brief-Qomo-2025-12-27.md` — W4 定义（第 3486 行）、最小 AC（第 3582 行）、快照冻结语义（第 3053 行）
- `src/types/workUnit.types.ts` — B0-1 身份语义 contract（SnapshotIdentity, WorkUnitSnapshot）
- `src/utils/workUnitSnapshotHelper.ts` — B0-1 Helper（createSnapshotIdentity, formatSnapshotId）
- `CLAUDE.md` — 双 schema 版本：dbSchemaVersion (local DB) 和 exportSchemaVersion (asset packages)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- 本故事文件由 `create-story` 工作流生成。
- 目标 story：`w4-versioned-snapshot-and-editing-continuity`
- 实施由 subagent-driven-development 完成，2 个实施任务 + 1 个验证任务。

### File List

**新增文件：**
- 无新增文件（所有改动在已有文件中）

**修改文件：**
- `src/services/StorageService.ts` — schema v5 + WorkUnitVersionRecord + workUnitVersions 表 + createSnapshot / listSnapshots / restoreSnapshot + simpleHash
- `src/hooks/useWorkUnitEditor.ts` — 增加 createSnapshot / listSnapshots / restoreSnapshot 方法
- `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` — 增加版本历史区域（创建快照 + 版本列表 + 恢复按钮）
- `tests/storageService.test.ts` — 增加快照 CRUD 测试（+11 tests）
- `tests/workUnitDetailComponent.test.tsx` — 增加版本历史 UI 测试（+3 tests）

**测试统计：** 181 tests（W3 的 167 + W4 新增 14），全部通过。
