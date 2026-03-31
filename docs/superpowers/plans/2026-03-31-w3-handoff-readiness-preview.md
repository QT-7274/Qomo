# W3: 交接准备预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a structured Prompt preview from Work Unit structure (Slots/Capabilities/Constraints), compute handoff readiness status, and provide copy/download export actions.

**Architecture:** Pure utility function `generatePromptPreview()` in `src/utils/` consumes a `WorkUnitRecord` and outputs a string. A companion `getHandoffReadiness()` computes status. The UI adds a "Preview & Handoff" section to `WorkUnitDetailComponent` with preview display, copy, download, and status badge.

**Tech Stack:** React 18, TypeScript, Vitest, @testing-library/react, navigator.clipboard API, Blob/URL for download

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/utils/promptGeneratorUtil.ts` | Create | `generatePromptPreview()` + `getHandoffReadiness()` pure functions |
| `src/utils/index.ts` | Modify | Add barrel exports |
| `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` | Modify | Preview & handoff UI section |
| `tests/promptGeneratorUtil.test.ts` | Create | Unit tests for prompt generation + handoff status |
| `tests/workUnitDetailComponent.test.tsx` | Modify | Preview panel rendering tests |

---

### Task 1: Prompt Generator Utility — Tests & Implementation

**Files:**
- Create: `src/utils/promptGeneratorUtil.ts`
- Modify: `src/utils/index.ts`
- Create: `tests/promptGeneratorUtil.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/promptGeneratorUtil.test.ts`:

```typescript
/**
 * promptGeneratorUtil 测试
 *
 * W3: Prompt 预览生成 + 交接准备状态计算。
 */

import { describe, it, expect } from 'vitest';
import { generatePromptPreview, getHandoffReadiness } from '../src/utils/promptGeneratorUtil';
import type { WorkUnitRecord } from '../src/services/StorageService';

function makeWU(overrides: Partial<WorkUnitRecord> = {}): WorkUnitRecord {
  return {
    id: 'wu-1',
    name: '测试单元',
    description: '描述',
    sourceType: 'created_new',
    slots: [],
    constraints: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('generatePromptPreview', () => {
  it('空 Slot + 空约束返回空字符串', () => {
    const wu = makeWU();
    expect(generatePromptPreview(wu)).toBe('');
  });

  it('有 Slot/Capability 时生成按 Slot 分段的文本', () => {
    const wu = makeWU({
      slots: [
        {
          id: 's1', name: '任务目标', slotType: 'context', required: true,
          capabilities: [
            { id: 'c1', name: '目标描述', content: '完成用户认证模块', order: 0 },
          ],
        },
        {
          id: 's2', name: '编码规范', slotType: 'rule', required: false,
          capabilities: [
            { id: 'c2', name: '规范A', content: '使用 TypeScript strict', order: 0 },
            { id: 'c3', name: '规范B', content: '遵循 ESLint 规则', order: 1 },
          ],
        },
      ],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('## 任务目标（上下文）');
    expect(text).toContain('完成用户认证模块');
    expect(text).toContain('## 编码规范（规则）');
    expect(text).toContain('使用 TypeScript strict');
    expect(text).toContain('遵循 ESLint 规则');
    // 顺序：任务目标在前
    expect(text.indexOf('任务目标')).toBeLessThan(text.indexOf('编码规范'));
  });

  it('Capability 按 order 排列', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: false,
        capabilities: [
          { id: 'c2', name: 'B', content: '第二', order: 1 },
          { id: 'c1', name: 'A', content: '第一', order: 0 },
        ],
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text.indexOf('第一')).toBeLessThan(text.indexOf('第二'));
  });

  it('待补齐 Slot 输出占位符', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: '仓库路径', slotType: 'context', required: true,
        capabilities: [],
        fillIn: { method: 'auto', hint: '从 workspace 提取' },
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('[待补齐: 仓库路径]');
  });

  it('约束包附在末尾', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: false,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
      }],
      constraints: [
        { id: 'cp1', name: '边界', constraintType: 'boundary', content: '不要编造', order: 0 },
      ],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('---');
    expect(text).toContain('### 边界（边界规则）');
    expect(text).toContain('不要编造');
    expect(text.indexOf('内容')).toBeLessThan(text.indexOf('不要编造'));
  });

  it('output 约束包附加格式和长度', () => {
    const wu = makeWU({
      constraints: [{
        id: 'cp1', name: '输出要求', constraintType: 'output', content: '结构化输出',
        order: 0, outputFormat: 'json', lengthLimit: { unit: 'words', max: 500 },
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('格式要求: JSON');
    expect(text).toContain('长度限制: ≤500 词');
  });

  it('quality 约束包附加检查清单', () => {
    const wu = makeWU({
      constraints: [{
        id: 'cp1', name: '质量', constraintType: 'quality', content: '自检',
        order: 0, checklistItems: [
          { id: 'ci1', text: '拼写检查', required: true, order: 0 },
          { id: 'ci2', text: '引用验证', required: false, order: 1 },
        ],
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('- [必需] 拼写检查');
    expect(text).toContain('- 引用验证');
  });
});

describe('getHandoffReadiness', () => {
  it('无 Slot 时返回 incomplete', () => {
    expect(getHandoffReadiness(makeWU())).toBe('incomplete');
  });

  it('所有 required Slot 有 Capability 且无 fillIn 时返回 ready', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: true,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('ready');
  });

  it('required Slot 无 Capability 时返回 incomplete', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: true,
        capabilities: [],
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('incomplete');
  });

  it('required Slot 有 fillIn 时返回 incomplete', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: true,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
        fillIn: { method: 'user-confirm' },
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('incomplete');
  });

  it('非 required Slot 有 fillIn 时返回 partial', () => {
    const wu = makeWU({
      slots: [
        {
          id: 's1', name: 'S1', slotType: 'context', required: true,
          capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
        },
        {
          id: 's2', name: 'S2', slotType: 'custom', required: false,
          capabilities: [],
          fillIn: { method: 'manual' },
        },
      ],
    });
    expect(getHandoffReadiness(wu)).toBe('partial');
  });

  it('只有非 required Slot 时，有 Capability 返回 ready', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: false,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('ready');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/promptGeneratorUtil.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement promptGeneratorUtil.ts**

Create `src/utils/promptGeneratorUtil.ts`:

```typescript
/**
 * Prompt 预览生成 + 交接准备状态计算
 *
 * W3 Story: 纯函数，不触碰 Dexie 或任何 side effect。
 * 输入 WorkUnitRecord，输出结构化 Prompt 文本或状态。
 */

import type { WorkUnitRecord } from '../services/StorageService';
import type { ConstraintPack } from '../types/constraint.types';

/** 交接准备状态 */
export type HandoffStatus = 'ready' | 'partial' | 'incomplete';

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const slotTypeLabels: Record<string, string> = {
  context: '上下文',
  rule: '规则',
  output: '输出',
  capability: '能力',
  custom: '自定义',
};

const constraintTypeLabels: Record<string, string> = {
  output: '输出',
  boundary: '边界规则',
  quality: '质量检查',
};

const outputFormatLabels: Record<string, string> = {
  markdown: 'Markdown',
  json: 'JSON',
  table: '表格',
  plaintext: '纯文本',
  yaml: 'YAML',
  csv: 'CSV',
};

const lengthUnitLabels: Record<string, string> = {
  characters: '字符',
  words: '词',
  lines: '行',
};

// ---------------------------------------------------------------------------
// Prompt generation
// ---------------------------------------------------------------------------

/** 基于 Work Unit 结构生成 Prompt 预览文本 */
export function generatePromptPreview(wu: WorkUnitRecord): string {
  const parts: string[] = [];

  // Slots section
  for (const slot of wu.slots) {
    const typeLabel = slotTypeLabels[slot.slotType] ?? slot.slotType;
    let header = `## ${slot.name}（${typeLabel}）`;

    if (slot.fillIn) {
      header += `\n\n[待补齐: ${slot.name}]`;
    }

    const sortedCaps = [...slot.capabilities].sort((a, b) => a.order - b.order);
    const capTexts = sortedCaps.map((c) => c.content).filter(Boolean);

    if (capTexts.length > 0 || slot.fillIn) {
      parts.push(header + (capTexts.length > 0 ? '\n\n' + capTexts.join('\n\n') : ''));
    } else if (slot.capabilities.length === 0 && !slot.fillIn) {
      // Empty slot with no fillIn — still show header
      parts.push(header);
    }
  }

  // Constraints section
  if (wu.constraints.length > 0) {
    const sorted = [...wu.constraints].sort((a, b) => a.order - b.order);
    const constraintTexts = sorted.map((cp) => renderConstraint(cp));
    parts.push('---\n\n' + constraintTexts.join('\n\n'));
  }

  return parts.join('\n\n');
}

function renderConstraint(cp: ConstraintPack): string {
  const typeLabel = constraintTypeLabels[cp.constraintType] ?? cp.constraintType;
  let text = `### ${cp.name}（${typeLabel}）\n\n${cp.content}`;

  if (cp.constraintType === 'output') {
    if (cp.outputFormat) {
      const fmtLabel = outputFormatLabels[cp.outputFormat] ?? cp.outputFormat;
      text += `\n\n格式要求: ${fmtLabel}`;
    }
    if (cp.lengthLimit) {
      const unitLabel = lengthUnitLabels[cp.lengthLimit.unit] ?? cp.lengthLimit.unit;
      const { min, max } = cp.lengthLimit;
      if (min != null && max != null) {
        text += `\n\n长度限制: ${min}-${max} ${unitLabel}`;
      } else if (max != null) {
        text += `\n\n长度限制: ≤${max} ${unitLabel}`;
      } else if (min != null) {
        text += `\n\n长度限制: ≥${min} ${unitLabel}`;
      }
    }
  }

  if (cp.constraintType === 'quality' && cp.checklistItems && cp.checklistItems.length > 0) {
    const sorted = [...cp.checklistItems].sort((a, b) => a.order - b.order);
    const items = sorted.map((ci) =>
      ci.required ? `- [必需] ${ci.text}` : `- ${ci.text}`
    );
    text += '\n\n' + items.join('\n');
  }

  return text;
}

// ---------------------------------------------------------------------------
// Handoff readiness
// ---------------------------------------------------------------------------

/** 计算交接准备状态 */
export function getHandoffReadiness(wu: WorkUnitRecord): HandoffStatus {
  if (wu.slots.length === 0) return 'incomplete';

  const requiredSlots = wu.slots.filter((s) => s.required);

  // Any required slot empty (no capabilities) → incomplete
  for (const slot of requiredSlots) {
    if (slot.capabilities.length === 0 && !slot.fillIn) return 'incomplete';
  }

  // Any required slot with fillIn → incomplete (must be resolved at runtime)
  for (const slot of requiredSlots) {
    if (slot.fillIn) return 'incomplete';
  }

  // Any non-required slot with fillIn → partial
  const hasNonRequiredFillIn = wu.slots.some((s) => !s.required && s.fillIn);
  if (hasNonRequiredFillIn) return 'partial';

  return 'ready';
}
```

- [ ] **Step 4: Update utils/index.ts barrel exports**

Add to `src/utils/index.ts`:

```typescript
export {
  generatePromptPreview,
  getHandoffReadiness,
} from './promptGeneratorUtil';

export type { HandoffStatus } from './promptGeneratorUtil';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/promptGeneratorUtil.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 6: Run full suite for regression**

Run: `cd /Users/shizheng/Qomo && npx vitest run`
Expected: All 150 existing + 13 new = 163 tests PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/utils/promptGeneratorUtil.ts src/utils/index.ts tests/promptGeneratorUtil.test.ts
git commit -m "feat(w3): Prompt 预览生成 + 交接准备状态计算工具函数"
```

---

### Task 2: Preview & Handoff UI Panel

**Files:**
- Modify: `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx`
- Modify: `tests/workUnitDetailComponent.test.tsx`

- [ ] **Step 1: Write failing component tests**

Append to `tests/workUnitDetailComponent.test.tsx`:

```typescript
  describe('预览与交接面板', () => {
    it('显示交接准备状态 — ready', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.addCapability(wu.id, after!.slots[0].id, { name: 'C', content: '内容' });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('✅ 可交接')).toBeTruthy();
      });
    });

    it('显示交接准备状态 — incomplete', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('❌ 需完善')).toBeTruthy();
      });
    });

    it('点击生成预览后显示 Prompt 文本', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.addCapability(wu.id, after!.slots[0].id, { name: '描述', content: '完成认证模块' });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('生成预览')).toBeTruthy();
      });
      fireEvent.click(screen.getByText('生成预览'));

      await waitFor(() => {
        expect(screen.getByText(/完成认证模块/)).toBeTruthy();
      });
    });

    it('空 Work Unit 导出按钮禁用', async () => {
      const wu = await StorageService.createWorkUnit('空WU');
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('❌ 需完善')).toBeTruthy();
      });
      const copyBtn = screen.getByText('复制');
      expect(copyBtn.closest('button')!.hasAttribute('disabled')).toBe(true);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/workUnitDetailComponent.test.tsx`
Expected: FAIL — no "可交接" or "生成预览" text rendered.

- [ ] **Step 3: Add preview & handoff UI**

In `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx`:

**Add imports** at top:

```typescript
import { generatePromptPreview, getHandoffReadiness } from '../../utils/promptGeneratorUtil';
import type { HandoffStatus } from '../../utils/promptGeneratorUtil';
```

**Add state** inside the component function (after existing state declarations):

```typescript
  // 预览状态
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
```

**Add computed values** after `const wu = editor.workUnit;`:

```typescript
  const handoffStatus: HandoffStatus = getHandoffReadiness(wu);
  const hasContent = wu.slots.some((s) => s.capabilities.length > 0) || wu.constraints.length > 0;
```

**Add handler functions:**

```typescript
  // ---------- 预览 ----------

  const handleGeneratePreview = () => {
    const text = generatePromptPreview(wu);
    setPreviewText(text);
  };

  const handleCopy = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // fallback: select all in pre
      window.alert('复制失败，请手动选择文本复制。');
    }
  };

  const handleDownload = () => {
    if (!previewText) return;
    const blob = new Blob([previewText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wu.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
```

**Add handoff status label map:**

```typescript
const handoffStatusLabels: Record<HandoffStatus, string> = {
  ready: '✅ 可交接',
  partial: '⚠️ 部分准备',
  incomplete: '❌ 需完善',
};

const handoffStatusStyles: Record<HandoffStatus, React.CSSProperties> = {
  ready: { padding: '0.25rem 0.75rem', background: '#c6f6d5', color: '#276749', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
  partial: { padding: '0.25rem 0.75rem', background: '#fefcbf', color: '#975a16', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
  incomplete: { padding: '0.25rem 0.75rem', background: '#fed7d7', color: '#c53030', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 },
};
```

**Add JSX** after the fill-in summary section (before the closing `</div>`):

```tsx
      {/* 预览与交接 */}
      <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>预览与交接</span>
        <span style={handoffStatusStyles[handoffStatus]}>{handoffStatusLabels[handoffStatus]}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button type="button" style={btnPrimary} onClick={handleGeneratePreview}>
          生成预览
        </button>
        <button type="button" style={btnSecondary} onClick={handleCopy} disabled={!previewText || !hasContent}>
          {copyFeedback ? '已复制 ✓' : '复制'}
        </button>
        <button type="button" style={btnSecondary} onClick={handleDownload} disabled={!previewText || !hasContent}>
          下载 .txt
        </button>
      </div>

      {!hasContent && (
        <p style={emptyHintStyle}>内容为空，请先添加 Slot 和 Capability。</p>
      )}

      {previewText !== null && (
        <pre style={previewBoxStyle}>{previewText || '（无内容）'}</pre>
      )}
```

**Add style:**

```typescript
const previewBoxStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#1a202c',
  color: '#e2e8f0',
  borderRadius: '8px',
  fontSize: '0.85rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflow: 'auto',
  maxHeight: '400px',
  fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/workUnitDetailComponent.test.tsx`
Expected: PASS (all existing + 4 new)

- [ ] **Step 5: Run full suite + lint + build**

Run: `cd /Users/shizheng/Qomo && npx vitest run && npm run lint && npm run build`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx tests/workUnitDetailComponent.test.tsx
git commit -m "feat(w3): 预览与交接面板 — 生成预览 + 复制 + 下载 + 交接状态"
```

---

### Task 3: Final Verification & Story Completion

**Files:**
- Modify: `docs/implementation-artifacts/w3-handoff-readiness-preview.md`
- Modify: `docs/implementation-artifacts/sprint-status.yaml`

- [ ] **Step 1: Run complete verification**

Run: `cd /Users/shizheng/Qomo && npm run lint && npm run build && npx vitest run`
Expected: All pass. Note final test count.

- [ ] **Step 2: Update story file with completion details**

Update Status from `ready-for-dev` to `done`, fill in File List and test count.

- [ ] **Step 3: Update sprint-status.yaml**

Change `w3-handoff-readiness-preview` from `ready-for-dev` to `done`.

- [ ] **Step 4: Commit**

```bash
cd /Users/shizheng/Qomo
git add docs/implementation-artifacts/w3-handoff-readiness-preview.md docs/implementation-artifacts/sprint-status.yaml
git commit -m "docs(w3): 标记 story 完成，更新文件清单"
```
