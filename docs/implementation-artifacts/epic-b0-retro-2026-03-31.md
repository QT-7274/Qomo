# Epic B0 回顾报告

**日期：** 2026-03-31
**项目：** Qomo
**Epic：** B0 — 基础设施与统一语义层
**状态：** ✅ 完成（2/2 stories done）

---

## 交付摘要

| 指标 | 数值 |
|------|------|
| Stories 完成 | 2/2（100%） |
| 提交次数 | 3（b0.1 实现 + b0.1 CR 修复 + b0.2 实现） |
| 新增代码行 | ~4,043 |
| 新增文件 | ~25 |
| 测试数量 | 50（全部通过） |
| 技术债延迟 | 5 项（已记录在 deferred-work.md） |
| 生产事故 | 0 |
| lint / build / test | 全部通过 |

### Story 交付记录

**B0.1 — 统一对象身份/版本/谱系 contract**
- 建立 11 个类型 + 8 个 helper + 演示组件
- 引入 Vitest 测试框架（23 个测试）
- Code review 后进行一轮修复（`ff6cb17`）

**B0.2 — 统一决策/回写/观测词汇**
- 建立 3 个类型文件 + 7 个 helper + 演示组件
- 复用 B0.1 模式，无新依赖引入
- Code review 产出 5 项 deferred work

---

## 做得好的

1. **模式复用链条有效** — B0.1 建立的架构模式（类型分文件、barrel export、helper 纯函数、演示组件隔离）被 B0.2 完整复用，零额外设计成本。
2. **边界控制严格** — 两个 story 都没有越权引入 backend schema、API、persistence 层，严格遵守 authority order 和 guardrails。
3. **测试框架从首个 story 建立** — 从零引入 Vitest + @testing-library/react，后续 story 无额外基础设施成本。
4. **Deferred work 机制健康** — 5 项技术债明确归档，每项都标注了处理时机（W5、O1、引入 Zod 时），不是黑洞式"以后再说"。
5. **CR 学习闭环在工作** — B0.1 CR 修复要点（`crypto.randomUUID()`、`isNaN`、`useMemo`、composite key）被 B0.2 直接沿用。

## 需要改进的

1. **首次实现的编码细节纪律** — B0.1 需要一轮 CR 修复才通过，修复内容是基础质量问题（ID 生成降级、时间处理方式、React key 使用 index、演示数据未用 `useMemo`），而不是架构判断错误。说明类型设计和分层决策正确，但编码细节自审不够。
2. **类型安全严谨度有空间** — 5 项 deferred work 全部与类型安全相关（discriminated union 缺失、条件必填字段未强制、反范式化字段一致性风险）。虽然留到引入 Zod 时统一处理是合理的，但反映了纯 TypeScript 类型层面的表达力限制。

## 关键洞察

1. **"首个 story 建立模式、后续 story 复用"策略有效** — B0.1 承担了更多负担（引入测试框架、确立文件结构、建立命名规范），但 B0.2 因此几乎是"填充式"实现。
2. **CR 修复列表就是最好的自审清单** — 与其事前设计抽象清单，不如把每次 CR 修复的具体要点传承到下一个 story 的 "Previous Story Intelligence"。
3. **Epic B0 的真正产出是"可被复用的 contract + 可被传承的模式"** — 类型系统和开发模式才是后续 Epic 的基础，演示组件只是验证手段。

---

## 行动项

### 流程改进

| # | 行动项 | 落地方式 |
|---|--------|----------|
| A1 | 建立 dev-story 自审清单，基于 B0.1 CR 修复要点 | 写入后续 create-story 的 Previous Story Intelligence |
| A2 | Deferred work 追踪保持在 deferred-work.md，sprint-planning 时主动检查 | sprint-planning checklist 补充 |

### 技术债（已记录在 deferred-work.md）

| ID | 内容 | 处理时机 | 优先级 |
|----|------|----------|--------|
| W1 | `generateId()` 降级碰撞风险 | 后续统一改用 `crypto.getRandomValues()` | Low |
| W2 | Helper 无运行时输入校验 | 引入 Zod 时统一补齐 | Medium |
| W3 | `failureReason` 应按 outcome 条件必填 | V5 或 O1 story | Medium |
| W4 | `FallbackOption.optionType` 语义耦合 | 引入更多 fallback 逻辑时 | Low |
| W5 | `issueCount` 反范式化一致性 | 引入 Zod 校验时 | Low |

### 团队约定

- B0.1 CR 修复清单作为后续 story 的 Previous Story Intelligence 基线
- 每个 story 的 deferred work 统一记录在 `deferred-work.md`，按来源标注

---

## Epic 1 准备评估

**结论：无阻塞项，Epic 1 可直接启动。**

Epic B0 产出的类型系统与 Epic 1 的依赖假设一致。W1 和 W2a 都只依赖 B0-1，可并行启动。

**建议在 W1/W2a create-story 时确认：**
- Dexie / IndexedDB 引入策略（W2a 首次触碰持久化）
- 状态管理方案选择（当前无决策）
- 路由方案（W1 需要页面导航）

**无重大发现需要修改 Epic 1 规划。**
