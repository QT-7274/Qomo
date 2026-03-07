# Create-PRD 输入与边界整理报告

**日期:** 2026-03-07  
**项目:** Qomo  
**任务:** 整理 BMAD create-prd 的输入与边界（仅初始化阶段，不进入正式生成）

---

## 1. 建议带入的输入文档清单

### 已发现的输入文档：
- ✅ **Product Brief**: `docs/analysis/product-brief-Qomo-2025-12-27.md` (已完成，6步)
  - 包含：核心愿景、问题陈述、用户分层、解决方案、安全边界、关键差异化点、成功指标

### 建议补充的输入文档（如有）：
- 现有 PRD (`docs/prd.md`) 已进行到第 8 步，包含：Executive Summary、Project Classification、Success Criteria、Product Scope、User Journeys、Innovation Points、Market Context、Validation Approach
- 建议：如需更新 PRD，应确认是否需要加载现有 PRD 作为"continuation"还是"fresh start"

### 其他可选输入：
- 现有 UX 设计规范 (`docs/ux-design-specification.md`) - 可作为参考但非必需
- 现有架构文档 (`docs/project-planning-artifacts/architecture.md`) - 可作为参考但非必需

---

## 2. 与当前 1.x 基线的关系说明

### 项目背景：
- **当前对象**: Qomo 2.x future branch（新产品，greenfield）
- **1.x 基线**: 无（本项目为全新产品，无现有版本）
- **关系**: 不适用 - 这是全新产品定义，无需与 1.x 兼容或迁移

### 项目分类确认：
- **Technical Type**: web_app
- **Domain**: general
- **Complexity**: low（领域合规复杂度低；产品交互与资产模型复杂度中等）
- **Project Context**: Greenfield - new project ✅

---

## 3. Workflow 中必须停下让用户选择/确认的原生节点

### Step 1 (初始化) - **STOP POINT 1**：
- **位置**: `step-01-init.md` 第 3 部分 "Fresh Workflow Setup"
- **触发条件**: 无现有 PRD 或 PRD 未完成
- **用户选择**:
  1. 确认发现的输入文档清单（Product Brief）
  2. 提供额外文档（如有）
  3. 选择 [C] Continue 进入 Step 2

### Step 1B (续接) - **STOP POINT 2**（如适用）：
- **位置**: `step-01b-continue.md` 第 5 部分 "Present Current Progress"
- **触发条件**: 现有 PRD 存在且未完成（stepsCompleted 不含 "step-11-complete"）
- **用户选择**:
  1. 确认当前进度与下一步
  2. 选择 [C] Continue 或调整

### 后续步骤的原生停止点（不在本次范围内）：
- Step 2: 项目发现 (Discovery) - 用户输入项目背景
- Step 3: 成功指标 (Success Criteria) - 用户定义成功标准
- Step 4-11: 各功能/非功能/打磨/完成步骤

---

## 4. Fresh / Continuation 判断方式与处理规则

### 判断逻辑：
```
IF docs/prd.md 存在:
  IF frontmatter.stepsCompleted 包含 "step-11-complete":
    → 工作流已完成，询问用户是否开始新 PRD 修订
  ELSE:
    → 工作流未完成，自动进入 Continuation (step-01b)
ELSE:
  → Fresh Start，执行 step-01-init
```

### 当前状态：
- **现有 PRD**: `docs/prd.md` 存在
- **stepsCompleted**: [1, 2, 3, 4, 5, 6, 7, 8]
- **判断结果**: **CONTINUATION** - 工作流未完成，应进入 step-01b
- **下一步**: 从 step-09-functional.md 继续

### 处理规则：
- **Fresh**: 创建新 PRD，加载 Product Brief，初始化 frontmatter
- **Continuation**: 加载现有 PRD，恢复 inputDocuments，确定下一步，继续工作流

---

## 5. 建议写回 Spec 的内容草稿

### 当前进度：
- ✅ Product Brief 完成（6/6 步）
- ✅ PRD 进行中（8/11 步）
- ⏸️ **当前停止点**: Step 1 初始化阶段分析完成
- 📋 **下一步**: 确认用户是否继续 PRD 工作流（step-09 onwards）或启动新 PRD 修订

### 验证结果：
- ✅ Workflow 定义完整，Step 1 初始化规则清晰
- ✅ 输入文档发现机制可行（Product Brief 已加载）
- ✅ Fresh/Continuation 判断逻辑可执行
- ✅ 原生停止点明确（Step 1 & Step 1B）

### 当前决策：
- **对象确认**: Qomo 2.x future branch (greenfield) ✅
- **输入文档**: Product Brief 已加载，无额外文档需求
- **工作流模式**: Continuation（现有 PRD 未完成）
- **建议**: 
  1. 确认用户是否继续现有 PRD（从 step-09 开始）
  2. 或启动新 PRD 修订（fresh start）
  3. **不启动正式 create-prd**，仅完成边界整理

---

## 附录：Workflow 关键文件位置

- 主工作流: `_bmad/bmm/workflows/2-plan-workflows/create-prd/workflow-create-prd.md`
- Step 1 初始化: `_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-01-init.md`
- Step 1B 续接: `_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-01b-continue.md`
- 输出 PRD: `docs/prd.md`
- 输入 Brief: `docs/analysis/product-brief-Qomo-2025-12-27.md`

