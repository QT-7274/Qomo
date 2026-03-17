---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
inputDocuments:
  - docs/prd.md
  - docs/ux-design-specification.md
  - docs/analysis/product-brief-Qomo-2025-12-27.md
workflowType: 'architecture'
project_name: 'Qomo'
user_name: 'drogbaqu'
date: '2026-02-03'
status: 'complete'
completedAt: '2026-02-07'
---
# Architecture Decision Document

*This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together.*

> Legacy / reference-only notice（Wave A authority convergence, 2026-03-11）本文档基于 docs/prd.md、docs/ux-design-specification.md 与当时的分析载体生成，当前只保留为 reference-only / legacy architecture artifact，不得表述为当前 2.x architecture authority。当前 2.x authority 以 workspace-native spec 为协同权威源，并以 _bmad-output/planning-artifacts/prd.md → _bmad-output/prd-handoff-to-design.md 为 formal inputs；docs/analysis/product-brief-Qomo-2025-12-27.md 仅作 validated carrier。因此，本文中围绕 模板 / 模块 / 约束包、Web-only 工作台、或“本地是唯一事实源（source of truth）”的旧口径，只能用于 continuity / migration / terminology 参考；它们不得覆盖当前 2.x 的 Work Unit / Slot / Capability、Web 设计 → VS Code 启动 → 外部 AI 交付，也不得覆盖 VS Code 为 runtime 事实源的边界。

## Project Context Analysis

### Requirements Overview

**Functional Requirements（架构含义）**

- **模板驱动的生成工作台**：围绕“模板/变量/约束包/预览/导出”的主链路组织信息架构与页面结构；实现上需要清晰的领域模型与 UI 状态边界，避免把业务规则散落在组件里。
- **资产模型（Templates / Modules / Constraint Packs）**
  - 资产需要可维护（创建/编辑/删除/标签/搜索/收藏/最近/历史组合）。
  - 模块与模板的关系会影响数据模型与后续治理扩展（尤其引用影响范围、演进策略）。
- **导出与兜底（可完成性优先）**
  - 导出必须多路径：复制（默认）/ 下载 `.txt`（可靠备选）/ 全选文本区（兜底）。
  - `export_denied`（权限/策略拒绝）属于预期分支，必须同屏给替代路径且不丢状态。
- **导入/导出资产包（迁移与恢复底座）**
  - 支持资产包 JSON 导入导出，包含 `version` 与兼容提示。
  - 导入冲突策略：合并 / 覆盖 / 新建副本（默认安全策略优先）。
  - 导入后提供导入报告与撤销能力（UX 已要求）。
- **导出前轻量校验（质量护栏）**
  - 唯一硬拦截：空内容/全占位符（`validation_blocked`）。
  - 其它校验默认非阻断（`validation_warning_shown`），但需要可定位与可解释。
- **隐私与可控**
  - 单次内容默认不入库；只有用户显式保存才沉淀为资产。
  - 设置中可关闭遥测、重置匿名标识、查看事件清单。

**Non-Functional Requirements（驱动架构决策的硬约束）**

- **可靠性（零失败目标）**
  - 系统侧 `export_error/copy_error` 目标为 0；失败必须可观测、可定位、可回归。
  - `export_denied` 不算系统 bug，但必须保证用户仍可完成导出。
- **性能（体验可测）**
  - 生成到预览可用：p95 ≤ 300ms，p99 ≤ 800ms。
  - 打开模板/切换约束包：p95 ≤ 200ms。
  - 复制/导出动作完成：p95 ≤ 200ms。
- **离线优先与可迁移**
  - 无登录/无同步前提下，本地数据一致性、迁移与版本兼容是第一等公民。
- **可观测与验收口径（Telemetry）**
  - 事件最小集与指标口径必须从架构层面固化（包括去重窗口与哈希规范化策略）。
  - 周口径按用户本地时区；需要本地匿名标识与可重置机制。
  - 遥测最小化：不上传完整 Prompt 原文，仅上传必要摘要（如 `normalized_hash`、`content_len`）与必要属性。
- **可访问性与响应式**
  - WCAG AA 作为底线；关键路径全键盘可完成；焦点可见；暗色输入可读。
  - 小屏不追求同等效率，但核心链路必须可完成（打开模板→填必填→预览→导出）。

**Scale & Complexity**

- Primary domain: Offline-first Web SPA workbench
- Complexity level: Medium
- Architectural building blocks (high-level):
  - Domain Model（模板/模块/约束包/组合/导出记录）
  - Local Persistence & Migration（含 versioning）
  - Import/Export Pipeline（冲突策略、报告、撤销）
  - Validation Layer（阻断/非阻断分级）
  - Export Completion Layer（复制/下载/全选兜底 + 事件口径强绑定）
  - Telemetry & Metrics（最小化、可关闭、去重口径）
  - UI Shell & Navigation（D2 分栏 + Command Center）
  - Accessibility & Responsive Baseline（统一验收条款）

### Technical Constraints & Dependencies

- **平台约束**：Web SPA；不做 SSR/预渲染；不做实时协作/长连接。
- **设计系统与组件策略**：Tailwind + `shadcn/ui`（含 `Command`、`Dialog/Sheet`、`Toast` 等）。
- **数据与隐私边界**：单次内容默认不入库；遥测最小化且可关闭；不上传完整 Prompt 原文。
- **遥测数据平台（仅你可见）**
  - 采集入口：EdgeOne 边缘函数接收事件并输出结构化 JSON 日志。
  - 数据汇聚：通过实时日志推送进入 CLS（用于检索/聚合/看板）。
  - 权限控制：CLS 读权限仅你拥有（IAM），满足“只有你能在后台查看”。
  - 明细策略：CLS 保留原始事件明细（不含原文）用于排障与口径复现；并建议配置合理的保留策略。
  - 边缘函数防线：schema 校验 + 字段白名单裁剪 + 限流/采样（防刷数据与防敏感字段误上报）。
  - schema 稳定性：事件字段命名/含义固定，避免口径漂移导致报表不可复现。

### Cross-Cutting Concerns Identified

- Offline persistence：数据模型、序列化格式、迁移兼容策略贯穿全域。
- Export reliability：错误分型（denied vs error）、兜底路径、与事件口径强绑定。
- Observability/metrics：事件一致性、去重窗口、匿名标识与可重置、隐私最小化、后台权限。
- Accessibility & keyboard-first：命令中心/弹层/表单/导出动作全链路一致规范。
- Validation layering：阻断与非阻断策略统一，避免页面各自为政。

## Starter Template Evaluation

### Current Starter Snapshot

- **UI / Runtime**: React + Vite + TypeScript（当前仓库已具备，适配 Web SPA 与离线优先）。
- **Build/Output**: Vite build 输出到 `dist/`（与静态托管/EdgeOne Pages 兼容）。
- **Backend**: 无自建后端；遥测数据平台采用 CLS（见 Step 2）。

### Decision

- **继续使用 React + Vite + TypeScript**：满足产品“先把基本功能做对”的节奏，避免引入 SSR/全栈框架的额外复杂度。
- **离线优先仍以本地持久化为主**：模板/模块/约束包等资产需要版本化与迁移能力，本地作为唯一可信写入源。
- **引入 EdgeOne Pages KV 作为“跨浏览器不丢模板”的远端备份/同步层**（不作为实时协作）：用于把用户显式保存的资产做远端冗余，降低仅离线存储导致的“换浏览器就丢”局限。
- **本期仅接入 CLS**：优先完成核心产品链路；遥测后台看板/告警与更深度监控可延后。

### EdgeOne Pages KV: Fit & Boundaries

- **适配点**
  - KV 的 `get/put/delete/list` 模型与“低频写入、按资产粒度读写”的模板备份较匹配。
  - 最终一致性对“备份/恢复”可接受（但不适合强一致协作）。
- **边界与应对**
  - **最终一致性（可能有同步延迟）**：将远端 KV 定位为“备份/同步”，而非“打开即最新”的单一事实源；UI 需要给出同步状态（例如：最近一次同步时间/是否有待同步更改）。
  - **无实时协作假设**：不同浏览器/设备并发修改时，采用可解释的冲突策略。

### Suggested Sync Strategy (Minimal, No-Backend)

- **数据分层**
  - **本地**：资产的主存储（离线可用、可迁移）。
  - **远端 KV**：仅同步“用户显式保存”的资产与必要索引（例如：模板列表元数据 + 模板内容）。
- **对象粒度与键设计（建议）**
  - 以“单个资产”为写入单位（例如：`template/{id}`），避免大对象频繁全量覆盖。
  - 元数据索引单独存放（例如：`index/templates`），用于加速远端恢复。
- **冲突策略（建议）**
  - 默认 **Last-Write-Wins**（以 `updatedAt` + `deviceId` 做判定），并在冲突发生时保留“副本”而非静默覆盖（符合“安全策略优先”）。
  - 远端仅用于恢复/同步，不引入复杂的 CRDT/OT。
- **隐私与权限（建议）**
  - 若未来需要“跨浏览器同步但不做账号系统”，建议提供 **用户自持的同步口令/同步码**，让不同浏览器加入同一同步空间；同步数据可选端到端加密，避免把可识别内容以明文落在远端。

### Impact on Near-Term Implementation

- **优先级**：先实现本地资产模型 + 导入导出 + 导出兜底链路；KV 同步作为增强项逐步接入。
- **Telemetry**：事件口径按 Step 2 固化；本期只保证边缘上报与 CLS 可查即可。

## 核心架构决策（Core Architectural Decisions）

### 数据架构（Data Architecture）

#### 本地持久化（唯一事实源）

- **主存储：IndexedDB + Dexie**（Dexie `v4.3.0`）
  - 适用原因：离线优先 + 资产型数据（模板/模块/约束包/组合/历史）需要索引查询、事务与可控迁移。
  - **边界：本地是唯一事实源（source of truth）**。远端 KV 仅作为备份/同步层，不反向强行覆盖本地编辑状态。

#### 运行时校验（导入/迁移/上报防线）

- **Schema 校验：Zod**（`v4.3.6`）
  - 用于：资产包导入导出结构校验、迁移前后断言、遥测 payload 白名单校验（防止敏感字段误上报、口径漂移）。

#### 版本化与迁移策略

- **双层版本化（推荐）**
- `dbSchemaVersion`：本地数据库结构版本（Dexie schema upgrades）
- `exportSchemaVersion`：资产包 JSON 版本（用于备份/跨设备迁移/兼容提示）
  - 收益：把“本地存储演进”和“导入兼容”解耦，排障与回归更清晰。

#### 远端备份/同步层（跨浏览器不丢模板）

- **EdgeOne Pages KV：备份/同步层**（最终一致性；明确不做实时协作）
  - 同步对象：仅同步“用户显式保存”的资产与必要索引；避免把临时草稿当作必须同步的数据。
  - UI 侧必须可观测：至少展示“是否有待同步更改 / 最近同步时间”。
- **E2EE（端到端加密，无后端账号体系）**
  - 用户提供 **同步口令/同步码** 用于在不同浏览器加入同一同步空间。
  - 前端使用 WebCrypto 进行密钥派生与加密后再写入 KV：
    - KDF（示例）：PBKDF2（含 `salt` 与 `iterations` 等参数）
    - Cipher：AES-GCM
    - KV 只存储：加密 blob + 最小必要元数据（如 `salt`、`kdfParams`、`keyVersion`、`updatedAt`、`deviceId`）
  - 明确失败模式：口令错误/解密失败必须“可检测 + 可解释 + 不破坏本地数据”；口令遗失的恢复策略以“资产包导出”作为恢复锚点（不承诺服务端找回）。
- **冲突处理（安全优先）**
  - 默认策略：LWW（Last-Write-Wins，以 `updatedAt` + `deviceId` 作为判定/兜底）
  - 冲突发生时：保留“副本”而非静默覆盖，符合导入冲突策略的安全取向。

## 实现模式与一致性规则（Implementation Patterns & Consistency Rules）

> 目标：约束所有 AI 代理在实现时遵循同一套“命名 / 分层 / 格式 / 流程”规则，避免实现分叉导致互不兼容。

### 关键冲突点清单（必须统一）

- 资产模型：Template / Module / ConstraintPack / Composition / ExportRecord 的字段命名、ID 策略、版本字段
- 本地存储：Dexie schema、迁移函数、事务边界、读写 API 分层
- 同步与加密：E2EE 的 KDF/算法/编码/元数据字段、解密失败处理、冲突策略
- 导出“永可完成”：copy / download / select-all 的状态机与错误分流
- Telemetry：事件名、payload 白名单、去重口径、隐私边界（不上传原文）

### 1) 强制目录与分层（所有代码必须在 `src/` 下）

- **组件（React）**：放在 `src/components/`
  - 文件命名遵循 `docs/mault.yaml`：`*Component.tsx` 或 `*.component.tsx`
- **Hooks**：放在 `src/hooks/`，命名 `use*.ts`
- **Services（副作用）**：放在 `src/services/`，命名 `*Service.ts`
- **Types**：放在 `src/types/`，命名 `*.types.ts`
- **Utils/Helpers（纯函数）**：放在 `src/utils/`，命名 `*Util*.ts` / `*Helper*.ts`

**分层硬约束（MUST）**

- 组件层（`src/components/*`）不得直接访问 Dexie / KV / Telemetry，必须通过 `src/services/*`。
- `src/utils/*` 必须是纯函数（不得读写存储/网络/全局状态）。

### 2) 命名规则（Naming Patterns）

- 类型/组件：`PascalCase`
- 函数/变量：`camelCase`
- 常量：`SCREAMING_SNAKE_CASE`
- Telemetry 事件名：统一 `snake_case`（与 PRD/UX 文档一致）
- 领域对象字段：统一 `camelCase`
- 资产包 JSON 字段：统一 `camelCase`

### 3) Dexie（本地唯一事实源）一致性规则

**表名固定（不得变体）**

- `templates` / `modules` / `constraintPacks` / `compositions` / `exportRecords` / `appMeta`

**所有资产对象最小字段集合（固定）**

- `id: string`
- `createdAt: string`（ISO 8601）
- `updatedAt: string`（ISO 8601）

**版本字段（固定）**

- 本地：`dbSchemaVersion`
- 资产包：`exportSchemaVersion`

**写入边界（MUST）**

- “保存为资产”的写入必须走服务层（`src/services/*Service.ts`）并在 Dexie 事务里完成。
- 远端 KV 不得作为写入事实源（只允许备份/同步）。

### 4) 资产包导入导出（Import/Export）一致性规则

**资产包顶层结构（固定）**

- 必须包含：`exportSchemaVersion`、`createdAt`、`items`
- `items` 的组织方式（按类型分组 or 统一列表）全项目只能选一种并保持一致。

**最小示例（按类型分组）**

```json
{
  "exportSchemaVersion": 1,
  "createdAt": "2026-02-07T12:34:56.000Z",
  "items": {
    "templates": [],
    "modules": [],
    "constraintPacks": [],
    "compositions": []
  }
}
```

**导入流程（MUST）**

1. Zod 校验（结构合法）
2. 冲突检测
3. 用户选择策略：合并 / 覆盖 / 新建副本
4. Dexie 事务落库
5. 生成导入报告 + 支持撤销本次导入（与 UX 文档一致）

### 5) Telemetry（一致口径 + 隐私红线）

**事件上报唯一入口（MUST）**

- 统一：`telemetryService.track(eventName, payload)`
- `payload` 必须先通过 Zod allowlist（白名单 schema）过滤

**隐私红线（MUST NOT）**

- 不上传 Prompt 原文
- 不上传模板/模块明文内容
- 不上传可识别个人信息

**去重口径（固定）**

- `dedup_window_seconds = 30`
- 规范化函数必须唯一（例如 `normalizeTextForHash()`），集中在 `src/utils/`，禁止多份实现。

### 6) 导出“永可完成”（Export Completion Layer）

**统一承载点（MUST）**

- UI：`ExportActionPanelComponent.tsx`（或 `export-action-panel.component.tsx`），对外暴露统一的导出面板交互
- 动作与异常分类：`ExportService.ts`（负责 copy/download/select-all 的实现与错误分类）

**错误分类硬约束（MUST）**

- `export_denied`（权限/策略拒绝）：同屏解释 + 直接给可完成路径（下载 `.txt` / 全选兜底）
- `copy_error` / `export_error`（系统异常）：同屏解释 + 仍给可完成路径（下载/全选），且不得清空预览/表单

### 7) E2EE + KV 同步一致性规则（跨浏览器备份/同步）

**KV 存储边界（MUST）**

- KV 只允许存：加密 blob + 最小元数据；不得存模板名/标签等可识别明文元数据。

**加密与编码（固定）**

- KDF：PBKDF2（`salt`、`iterations`、`hash`）
- Cipher：AES-GCM
- KV 中二进制字段统一使用 **base64url** 编码字符串（避免 hex/base64 混用导致不可互通）

**元数据字段命名（固定）**

- `salt`、`kdfParams`、`keyVersion`、`updatedAt`、`deviceId`

**解密失败处理（MUST）**

- 必须可检测并明确提示（口令错误/数据损坏）
- 同步失败不得覆盖/删除本地资产（本地仍是唯一事实源）

**冲突处理（固定）**

- 默认 LWW：`updatedAt` + `deviceId`
- 冲突时保留副本（安全优先，与导入策略一致）

### 8) 执行与验收（Enforcement）

**所有 AI 代理 MUST**

- 遵守目录分层边界（组件不直连存储/网络）
- 遵守 Telemetry 白名单与隐私红线
- 遵守 E2EE 编码/字段命名/失败模式处理

**测试目录约定（提前固化，避免分叉）**

- 单测/集成测试统一放 `tests/`（命名 `*.test.ts(x)` / `*.spec.ts(x)`），与 `docs/mault.yaml` 保持一致。

## 项目结构与边界（Project Structure & Boundaries）

### Complete Project Directory Structure

> 说明：这里定义的是“目标态与新增文件落点”，不会强制你现在就重命名/重排已有文件；现有结构可逐步迁移。新增文件建议遵循 docs/mault.yaml 的命名与落盘规则（如 *Service.ts、use*.ts、*.types.ts）。

```text
Qomo/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   └── vite.svg
├── docs/
│   ├── prd.md
│   ├── ux-design-specification.md
│   ├── mault.yaml
│   ├── project-planning-artifacts/
│   │   ├── architecture.md
│   │   └── bmm-workflow-status.yaml
│   └── implementation-artifacts/
├── src/
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── assets/
│   ├── components/
│   │   ├── App/
│   │   │   └── App.tsx
│   │   ├── Workbench/
│   │   │   └── WorkbenchComponent.tsx
│   │   ├── Settings/
│   │   │   └── SettingsComponent.tsx
│   │   ├── Assets/
│   │   │   └── AssetsComponent.tsx
│   │   ├── ExportActionPanel/
│   │   │   └── ExportActionPanelComponent.tsx
│   │   ├── ImportWizard/
│   │   │   └── ImportWizardComponent.tsx
│   │   └── CommandCenter/
│   │       └── CommandCenterComponent.tsx
│   ├── hooks/
│   │   ├── useTemplates.ts
│   │   ├── useImportExport.ts
│   │   ├── useExport.ts
│   │   ├── useTelemetry.ts
│   │   └── useSync.ts
│   ├── services/
│   │   ├── StorageService.ts
│   │   ├── ImportExportService.ts
│   │   ├── ExportService.ts
│   │   ├── TelemetryService.ts
│   │   └── SyncService.ts
│   ├── types/
│   │   ├── domain.types.ts
│   │   ├── assetPack.types.ts
│   │   └── telemetry.types.ts
│   └── utils/
│       ├── normalizeTextForHashUtil.ts
│       ├── cryptoUtil.ts
│       └── timeUtil.ts
└── tests/ (defer)
```

### Route Table（固定路由表）

- `/`
  - Component: `WorkbenchComponent.tsx`
  - Responsibility: 模板选择 → 填写 → 预览 → 导出（核心主链路）
- `/assets`
  - Component: `AssetsComponent.tsx`
  - Responsibility: 资产管理入口（模板/模块/约束包）
  - Note: 导入/导出等长流程以弹层组件完成（如 `ImportWizardComponent.tsx`），避免路由化导致状态丢失。
- `/settings`
  - Component: `SettingsComponent.tsx`
  - Responsibility: 隐私与数据（遥测开关/重置匿名标识/事件清单）、同步口令/同步状态、恢复入口
- **可选二级路由（用于可发现性，不承载长流程状态）**
  - `/settings/privacy`、`/settings/sync`
  - `/assets/import`（仅定位入口，流程仍由 `ImportWizard` 弹层完成）

### Architectural Boundaries

**UI / Routing Boundaries**

- 路由负责“页面级导航与可恢复入口”，不承载长流程状态。
- 路由切换不得隐式清空工作台草稿/预览（避免“切设置就丢状态”）。

**Modal/Panel Boundaries（必须是组件，不是路由）**

- `ExportActionPanelComponent.tsx`：导出“永可完成”的交互与状态机收敛点。
- `ImportWizardComponent.tsx`：预检 → 冲突策略 → 执行 → 报告/撤销（长流程，需要保持状态）。
- `CommandCenterComponent.tsx`：命令中心（快捷动作/搜索）。

**Service Boundaries（与 Step 5 一致）**

- Dexie：`StorageService.ts` 为唯一入口（本地事实源）。
- 资产包导入导出：`ImportExportService.ts`（Zod 校验 → 冲突策略 → 事务落库 → 报告/撤销）。
- 导出动作：`ExportService.ts`（copy/download/select-all + 错误分类）。
- Telemetry：`TelemetryService.ts`（事件上报唯一入口 + allowlist）。
- 同步：`SyncService.ts`（KV + E2EE，失败不破坏本地；不反向覆盖本地编辑）。

### Requirements → Structure Mapping

- **模板库（最近/收藏/搜索）**
  - UI: `TemplateSidebar`（位于 `WorkbenchComponent.tsx` 或拆分为独立组件）
  - Service: `StorageService.ts`
- **主链路（填变量 → 预览）**
  - UI: `WorkbenchComponent.tsx`
  - Utils: `normalizeTextForHashUtil.ts`（去重口径与 hash 规范化唯一实现）
- **导出永可完成（复制/下载/全选兜底）**
  - UI: `ExportActionPanelComponent.tsx`
  - Service: `ExportService.ts`
- **资产包导入/导出（报告 + 撤销）**
  - UI: `ImportWizardComponent.tsx`
  - Service: `ImportExportService.ts`
  - Types: `assetPack.types.ts`
- **跨浏览器备份/同步（KV + E2EE）**
  - UI: `SettingsComponent.tsx`（同步口令/状态展示入口）
  - Service: `SyncService.ts`
  - Utils: `cryptoUtil.ts`
- **隐私与可控（关闭遥测/重置匿名标识/事件清单）**
  - UI: `SettingsComponent.tsx`
  - Services: `TelemetryService.ts` + `StorageService.ts`

### Test Organization（只规定，不落盘）

- 未来引入测试时，统一使用 `tests/` 作为根目录（命名 `*.test.ts(x)` / `*.spec.ts(x)`），避免出现 `src/__tests__`、`test/` 等分叉。

## 架构校验结果（Architecture Validation Results）

### 一致性校验 ✅

- **技术栈自洽**：Web SPA（React + Vite + TypeScript）+ `Tailwind` + `shadcn/ui` 与“桌面优先工作台 + 小屏可完成”的 UX 目标一致。
- **分层自洽**：UI（`components`）→ 编排（`hooks`）→ 副作用（`services`）→ 数据（Dexie）→ 备份/同步（KV + E2EE），边界清晰，避免不同实现互相打穿。
- **数据事实源自洽**：Dexie 为本地唯一事实源；KV 仅作为备份/同步层，且“失败不破坏本地/不反向静默覆盖本地编辑”。
- **路由自洽**：`react-router` 负责“页面级入口与可恢复链接”，长流程（导入向导/导出面板/命令中心）收敛为弹层组件，避免路由化导致状态丢失。

### 需求覆盖校验 ✅

- **主链路**（选模板 → 填写 → 预览 → 导出）：由 `Workbench` + `StorageService` + `ExportActionPanel` / `ExportService` 覆盖。
- **导出永可完成**：明确区分 `export_denied`（权限/策略拒绝）与 `copy_error/export_error`（系统异常），并要求同屏给可完成兜底路径且不丢状态。
- **资产包迁移/恢复**：导入/导出资产包（含冲突策略、导入报告、撤销）有明确的服务层落点与 schema 校验防线。
- **隐私与可控**：遥测最小化、可关闭、可重置匿名标识、可查看事件清单；不上传 Prompt 原文。
- **跨浏览器不丢模板**：KV + E2EE（同步口令/同步码）路径明确，作为备份/同步层而非实时协作。

### 实现就绪校验 ✅

- **一致性规则可执行**：已固化命名/目录/分层/事件口径/加密字段命名与失败模式处理，降低 AI 代理实现分叉风险。
- **补齐的关键决策（来自校验阶段）**
  - **状态管理**：引入 `Zustand`，但严格限定为 **UI store**（只存 `id/flags`/面板开关/轻量提示）；**资产数据仍以 Dexie 为唯一事实源**，禁止把模板内容/资产数据存入 store。
  - **KV 同步粒度**：按 **资产粒度** 同步（如 `templates/{id}`、`modules/{id}`），仅在“用户显式保存资产”后 best-effort 同步；冲突按 LWW 判定并保留副本。

### Gap 分析（已识别，非阻塞）

- **依赖版本锁定**：实现阶段建议在 `package.json` 锁定关键依赖版本（如 `react-router`、`zustand`、`dexie`、`zod`），避免不同分支/代理使用不同版本。
- **Dexie 索引与 schema 细节**：表名/字段与事实源边界已确定；索引设计可在首批实现 story 中补齐最小可用 schema。
- **KV Key 命名空间**：已确定“按资产粒度”；具体 key namespace 规则可在同步 story 中细化（并保持全局唯一规范）。

### 架构就绪结论

- **Overall Status**：READY FOR IMPLEMENTATION
- **说明**：架构决策、实现一致性规则、项目结构与边界已足够支撑拆分史诗/故事并进入实现阶段；上述 gap 可在不破坏主链路的前提下迭代补齐。

## Architecture Completion Summary

### Workflow Completion

- **Architecture Decision Workflow**：COMPLETED ✅
- **Total Steps Completed**：8
- **Date Completed**：2026-02-07
- **Document Location**：`docs/project-planning-artifacts/architecture.md`

### Implementation Handoff（下一阶段建议）

1. 以本文档为唯一事实源：新实现/重构先对照“实现模式与一致性规则”。
2. 下一工作流建议进入：`create-epics-and-stories`，把 PRD/UX 拆成可给 AI 执行的故事（按路由与服务边界落点）。
3. 实现优先级建议从“本地事实源 + 工作台主链路 + 导出永可完成”开始；KV 同步按增强项逐步接入。

**Architecture Status**：READY FOR IMPLEMENTATION ✅