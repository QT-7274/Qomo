## title: 'Qomo 2.x 能力化 Prompt 工作台 quick-spec'slug: 'qomo-2x-capability-prompt-workbench-quick-spec'created: '2026-03-06'status: 'ready-for-dev'stepsCompleted: [1, 2, 3, 4]tech_stack: ['Markdown', 'React', 'TypeScript', 'Vite', 'BMAD planning docs']files_to_modify: ['_bmad-output/implementation-artifacts/tech-spec-qomo-2x-capability-prompt-workbench-quick-spec.md', 'docs/analysis/product-brief-Qomo-2025-12-27.md']code_patterns: ['现有 BMAD 产物通过 Markdown 文档沉淀，使用 frontmatter 标记步骤状态', '未来演进探索以追加附录或新增规划段落的方式记录，不直接覆盖当前 PRD/UX/Architecture 基线', 'Web 产品当前基线是 React + Vite + TypeScript 的单体前端应用，规划文档强调离线优先与边界明确']test_patterns: ['本任务为文档收敛，不涉及自动化测试；验证方式是跨文档一致性与约束对齐检查']

# Tech-Spec: Qomo 2.x 能力化 Prompt 工作台 quick-spec

**Created:** 2026-03-06

## Overview

### Problem Statement

Qomo 需要在不替代当前 1.x PRD / UX / Architecture / MVP 基线的前提下，为未来演进方向形成一份可追踪的 quick-spec，优先收敛产品主线、首批用户、首批高价值场景、最小对象模型、Web / VS Code 分工，以及 `Qomo 1.x → 2.x` 的过渡表述。

### Solution

以“能力化 Prompt 工作台（方向 C）为主线、IDE 任务启动器 / Copilot Layer（方向 B）为验证视角”为默认起点，围绕高频 AI 编码工作流用户，定义 `Work Unit / Slot / Capability` 的最小边界，并输出一份可供后续继续收敛或进入 `create-product-brief` 的 quick-spec 结果。

### Scope

**In Scope:**

- 方向 C 与方向 B 的主次关系或组合方式
- 首批目标用户定义
- 2-3 个高价值场景优先级
- `Work Unit / Slot / Capability` 的最小对象模型边界
- Web 与 VS Code 各自的一号任务
- `Qomo 1.x → 2.x` 的过渡表述
- 少量待验证问题与下一步 BMAD 建议

**Out of Scope:**

- 编码、原型实现、技术 Spike
- 完整 Agent / MCP / Tool 编排协议设计
- 团队协作权限系统、模型直连、商业化与定价
- 替代当前已有 PRD / UX / Architecture / MVP 基线

## Context for Development

### Codebase Patterns

- 当前仓库的正式 BMAD 规划产物以 Markdown 文档形式保存在 `docs/` 下，均带有明确的基线角色；本轮 quick-spec 只能作为未来演进探索的追加结论，不能覆盖这些基线。
- `docs/prd.md` 定义的仍是 Qomo 1.x：一个以 Template / Module / Constraint Pack 为核心的 Web Prompt 资产工作台；其非目标已明确包含“不直连模型”“不做团队协作权限系统”。
- `docs/project-planning-artifacts/architecture.md` 进一步固定了当前实现宿主与边界：React + Vite + TypeScript 的 Web SPA、离线优先、本地为事实源、当前产品形态以 Web 端为主。
- `docs/analysis/product-brief-Qomo-2025-12-27.md` 已包含本轮未来演进所需的两层输入：脑暴结论，以及“quick-spec 输入整理与关键分歧”；因此最合适的落点是继续在该文档中追加 quick-spec 结果，而不是另起一套平行文档体系。
- 本轮若需形成对象模型，只能收敛到 `Work Unit / Slot / Capability` 这类产品层边界，不进入完整执行编排或插件 API 细节。

### Files to Reference

| File | Purpose |
| --- | --- |
| _bmad-output/implementation-artifacts/tech-spec-qomo-2x-capability-prompt-workbench-quick-spec.md | 本轮 quick-spec workflow 的最终 spec 载体 |
| docs/analysis/product-brief-Qomo-2025-12-27.md | 本轮未来演进探索的主输入与 quick-spec 收敛落点 |
| docs/prd.md | 当前 Qomo 1.x 产品基线，明确 1.x 叙事与非目标 |
| docs/project-planning-artifacts/architecture.md | 当前 Web 架构基线与宿主边界，防止未来叙事误覆盖现有实现基线 |

### Technical Decisions

- 本次 quick-spec 明确定位为“未来演进探索”，不替代当前已完成的 PRD / UX / Architecture / MVP 基线。
- 结果落盘策略采用“双轨”：workflow spec 保存在 `_bmad-output/implementation-artifacts/tech-spec-qomo-2x-capability-prompt-workbench-quick-spec.md`，对外可追踪结论写回 `docs/analysis/product-brief-Qomo-2025-12-27.md`。
- 默认起点继续沿用已验证输入：方向 C 为主线、方向 B 为验证视角；首批服务对象倾向高频 AI 编码工作流用户；场景优先级倾向任务启动、代码审查、调试排障。
- 本轮不定义代码级改动文件或测试文件，主要修改对象是分析/规划文档；因此“files to modify”限定为 workflow spec 与分析主文档。

## Implementation Plan

### Tasks

- [ ] Task 1: 在现有分析主文档中追加 quick-spec 收敛结果
  - File: `docs/analysis/product-brief-Qomo-2025-12-27.md`
  - Action: 追加一个新的 quick-spec 结果章节，明确核心问题陈述、关键决策、少量待验证问题，以及建议下一步 BMAD 流程。
  - Notes: 必须显式声明该结果属于未来演进探索，不替代当前 Qomo 1.x PRD / UX / Architecture / MVP 基线。
- [ ] Task 2: 固化方向 C / B、目标用户、首批场景与对象模型最小边界
  - File: `docs/analysis/product-brief-Qomo-2025-12-27.md`
  - Action: 用决策性表述写清“C 为主线，B 为验证视角”“首批服务高频 AI 编码工作流用户”“优先场景为任务启动 / 代码审查 / 调试排障”“对象模型最小边界为 Work Unit / Slot / Capability”。
  - Notes: 只收敛产品层边界，不延展为完整 Agent / Tool / MCP 编排模型。
- [ ] Task 3: 固化 Web / VS Code 分工与 `Qomo 1.x → 2.x` 过渡叙事
  - File: `docs/analysis/product-brief-Qomo-2025-12-27.md`
  - Action: 明确 Web 是设计台、VS Code 是启动台；同时给出 1.x 到 2.x 的兼容映射与阶段性边界表述。
  - Notes: 需要同时保留连续性与升级感，避免把 2.x 讲成“已是完整执行平台”。
- [ ] Task 4: 维护 workflow spec 作为内部追踪载体
  - File: `_bmad-output/implementation-artifacts/tech-spec-qomo-2x-capability-prompt-workbench-quick-spec.md`
  - Action: 记录本轮 quick-spec 的范围、上下文、验收标准与评审状态，作为 workflow 执行痕迹。
  - Notes: 该 spec 是过程与结论的内部承载文档；外部可追踪结果仍以分析主文档为准。

### Acceptance Criteria

- [ ] AC 1: Given 当前仓库已存在 Qomo 1.x 的 PRD 与 Architecture 基线, when 读者查看 quick-spec 结果, then 文档必须明确说明本轮只属于未来演进探索而非替代现有基线。
- [ ] AC 2: Given 本轮 quick-spec 需要回答方向收敛问题, when 读者查看结果章节, then 能直接找到方向 C 与方向 B 的主次关系，并理解为何采用该组合方式。
- [ ] AC 3: Given 本轮需要锁定首批服务对象与场景, when 读者查看结果章节, then 能看到明确的首批目标用户定义，以及 2-3 个优先场景和其优先理由。
- [ ] AC 4: Given 产品仍处于“生成型 + 辅助执行型”为主的阶段, when 读者查看对象模型部分, then 结果只收敛到 `Work Unit / Slot / Capability` 的最小边界，且不会误读为完整执行平台设计。
- [ ] AC 5: Given 产品需要同时解释 Web 与 VS Code 的存在价值, when 读者查看双端分工部分, then 能清楚区分 Web 一号任务与 VS Code 一号任务，并避免双端重复建设叙事。
- [ ] AC 6: Given Qomo 需要保留从 1.x 到 2.x 的连续性, when 读者查看过渡表述部分, then 能看到 1.x 的兼容层角色、2.x 的升级定义，以及至少一组清晰的对象映射关系。
- [ ] AC 7: Given 本轮结果需要可供后续继续收敛, when 读者查看章节结尾, then 文档必须只保留少量待验证问题，并给出建议进入的下一步 BMAD 流程。

## Additional Context

### Dependencies

- 输入依赖：`docs/analysis/product-brief-Qomo-2025-12-27.md` 中的脑暴附录、脑暴纪要与 quick-spec 输入整理
- 基线依赖：`docs/prd.md` 与 `docs/project-planning-artifacts/architecture.md`
- 约束依赖：不直连模型、个人使用优先、不做团队协作权限系统、先以“生成型 + 辅助执行型”为主
- 输出依赖：本轮结果需能够自然衔接后续 `create-product-brief`，而不是直接进入实现

### Testing Strategy

- 手动校验 1：核对 quick-spec 是否完整回答了 6 个执行目标问题
- 手动校验 2：核对文档是否明确保留并继承默认约束，没有越界承诺模型直连、团队协作或完整执行平台
- 手动校验 3：交叉检查 quick-spec 与现有 `docs/prd.md` / `docs/project-planning-artifacts/architecture.md` 是否存在冲突性表述
- 手动校验 4：确认结论写入现有分析主文档，且读者无需阅读对话历史也能理解本轮收敛结果

### Notes

- 高风险项 1：如果把方向 B 提升为主产品叙事，容易把 Qomo 过早收缩为插件功能集合，损失 Web 端的资产设计价值。
- 高风险项 2：如果在本轮把 `Capability` 直接展开为完整 Tool / Agent / MCP 执行协议，会过早进入重编排问题，削弱 quick-spec 的收敛效率。
- 已知限制：本轮没有新增用户访谈或外部验证，仍主要基于内部脑暴与现有 BMAD 产物做方向收敛。
- 后续考虑：若 quick-spec 审阅通过，优先进入 `create-product-brief`，把本轮决策转写为更正式的未来演进 brief；如仍对首批用户或场景有明显疑问，再补一轮轻量验证。