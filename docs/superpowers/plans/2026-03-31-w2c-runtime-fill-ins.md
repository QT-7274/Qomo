# W2c: 待补齐项语义声明 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fill-in semantics to Slots so users can declare which inputs need runtime completion in VS Code, versus what's fully defined at design time in Web.

**Architecture:** Extend the existing `Slot` type with an optional `FillInDeclaration` field. Add `setSlotFillIn`/`clearSlotFillIn` to StorageService (schema v4). Expose via `useWorkUnitEditor` hook. Add UI for fill-in toggle, method selector, hint text, and a summary panel in WorkUnitDetailComponent.

**Tech Stack:** React 18, TypeScript, Dexie (IndexedDB), Vitest, @testing-library/react, fake-indexeddb

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/fillIn.types.ts` | Create | `FillInMethod` type + `FillInDeclaration` interface |
| `src/types/slot.types.ts` | Modify | Add optional `fillIn?: FillInDeclaration` to `Slot` |
| `src/types/index.ts` | Modify | Add barrel exports for new types |
| `src/services/StorageService.ts` | Modify | Schema v4 + `setSlotFillIn` / `clearSlotFillIn` |
| `src/hooks/useWorkUnitEditor.ts` | Modify | Add `setSlotFillIn` / `clearSlotFillIn` methods |
| `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` | Modify | Fill-in UI on Slots + summary panel |
| `tests/fillIn.types.test.ts` | Create | Type contract tests |
| `tests/storageService.test.ts` | Modify | Fill-in CRUD + clone tests |
| `tests/workUnitDetailComponent.test.tsx` | Modify | Fill-in UI rendering tests |

---

### Task 1: Define FillIn Shared Types

**Files:**
- Create: `src/types/fillIn.types.ts`
- Modify: `src/types/slot.types.ts`
- Modify: `src/types/index.ts`
- Create: `tests/fillIn.types.test.ts`

- [ ] **Step 1: Write type contract tests**

Create `tests/fillIn.types.test.ts`:

```typescript
/**
 * FillIn 类型契约测试
 *
 * 验证待补齐类型结构满足 W2c AC 要求。
 */

import { describe, it, expect } from 'vitest';
import type { FillInMethod, FillInDeclaration } from '../src/types';
import type { Slot } from '../src/types';

describe('FillIn types contract', () => {
  it('FillInMethod 包含三种补齐方式', () => {
    const methods: FillInMethod[] = ['auto', 'user-confirm', 'manual'];
    expect(methods).toHaveLength(3);
  });

  it('FillInDeclaration 基础结构', () => {
    const decl: FillInDeclaration = {
      method: 'auto',
      hint: '从当前仓库路径自动提取',
    };
    expect(decl.method).toBe('auto');
    expect(decl.hint).toBe('从当前仓库路径自动提取');
  });

  it('FillInDeclaration hint 为可选', () => {
    const decl: FillInDeclaration = { method: 'manual' };
    expect(decl.hint).toBeUndefined();
  });

  it('Slot 支持可选 fillIn 字段', () => {
    const slot: Slot = {
      id: 'slot-1',
      name: '任务目标',
      slotType: 'context',
      required: true,
      capabilities: [],
      fillIn: { method: 'user-confirm', hint: '请描述本次任务目标' },
    };
    expect(slot.fillIn).toBeDefined();
    expect(slot.fillIn!.method).toBe('user-confirm');
  });

  it('Slot 无 fillIn 表示设计时已完全定义', () => {
    const slot: Slot = {
      id: 'slot-2',
      name: '编码规范',
      slotType: 'rule',
      required: false,
      capabilities: [],
    };
    expect(slot.fillIn).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/fillIn.types.test.ts`
Expected: FAIL — `FillInMethod` and `FillInDeclaration` not exported from `../src/types`, `fillIn` not on `Slot`.

- [ ] **Step 3: Create fillIn.types.ts**

Create `src/types/fillIn.types.ts`:

```typescript
/**
 * FillIn 共享类型定义
 *
 * W2c Story: 为 Slot 提供待补齐项语义声明。
 *
 * 三种补齐方式：
 * - auto: 可从 workspace 自动提取（如仓库路径、当前文件）
 * - user-confirm: 需用户显式确认（如任务目标、关键上下文）
 * - manual: 需手动输入或标记暂缺（如特殊要求、临时补充）
 *
 * === 扩展预留 ===
 * V2 可能增加：运行时补齐状态、实际填入值
 * W3 可能增加：交接准备时的待补齐摘要展示
 */

/** 补齐方式 */
export type FillInMethod = 'auto' | 'user-confirm' | 'manual';

/** 待补齐声明 */
export interface FillInDeclaration {
  /** 补齐方式 */
  method: FillInMethod;
  /** 提示文本，向 VS Code 端说明该位需要什么信息 */
  hint?: string;
}
```

- [ ] **Step 4: Update slot.types.ts — add fillIn field**

In `src/types/slot.types.ts`, add import and field. The file becomes:

```typescript
/**
 * Slot 共享类型定义
 *
 * W2a Story: 为 Work Unit 提供结构化的能力挂载点。
 *
 * Slot 是 Work Unit 内部的结构骨架节点，
 * 按类型分类（context / rule / output / capability / custom），
 * 每个 Slot 下可挂载多个 Capability。
 *
 * === 扩展预留 ===
 * W2b 可能增加：约束语义（constraints）、输出格式声明
 * W2c: 待补齐项语义（fillIn）
 */

import type { Capability } from './capability.types';
import type { FillInDeclaration } from './fillIn.types';

/** Slot 类型枚举 */
export type SlotType = 'context' | 'rule' | 'output' | 'capability' | 'custom';

/** Work Unit 中的结构化挂载点 */
export interface Slot {
  /** 唯一 ID（UUID） */
  readonly id: string;

  /** 用户可见名称 */
  name: string;

  /** Slot 类型 */
  slotType: SlotType;

  /** 可选描述 */
  description?: string;

  /** 是否为必需 Slot */
  required: boolean;

  /** 挂载的 Capability 列表（按 order 排序） */
  capabilities: Capability[];

  /** 待补齐声明（可选，undefined 表示设计时已完全定义） */
  fillIn?: FillInDeclaration;
}
```

- [ ] **Step 5: Update index.ts barrel exports**

Add to `src/types/index.ts`:

```typescript
export type {
  FillInMethod,
  FillInDeclaration,
} from './fillIn.types';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/fillIn.types.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 7: Run full test suite for regression**

Run: `cd /Users/shizheng/Qomo && npx vitest run`
Expected: All 133 existing tests + 5 new = 138 tests PASS

- [ ] **Step 8: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/types/fillIn.types.ts src/types/slot.types.ts src/types/index.ts tests/fillIn.types.test.ts
git commit -m "feat(w2c): 定义 FillIn 共享类型 — 三种补齐方式 + Slot.fillIn 可选字段"
```

---

### Task 2: Extend StorageService with FillIn CRUD

**Files:**
- Modify: `src/services/StorageService.ts`
- Modify: `tests/storageService.test.ts`

- [ ] **Step 1: Write failing tests for setSlotFillIn / clearSlotFillIn / clone**

Append to the `describe('StorageService', ...)` block in `tests/storageService.test.ts`:

```typescript
  describe('setSlotFillIn', () => {
    it('为 Slot 设置待补齐声明', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'user-confirm', hint: '请描述任务目标' });

      const after2 = await StorageService.getWorkUnit(wu.id);
      const slot = after2!.slots[0];
      expect(slot.fillIn).toBeDefined();
      expect(slot.fillIn!.method).toBe('user-confirm');
      expect(slot.fillIn!.hint).toBe('请描述任务目标');
    });

    it('更新已有的待补齐声明', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '文件', slotType: 'context', required: false });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'auto' });
      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'manual', hint: '手动补充' });

      const after2 = await StorageService.getWorkUnit(wu.id);
      expect(after2!.slots[0].fillIn!.method).toBe('manual');
      expect(after2!.slots[0].fillIn!.hint).toBe('手动补充');
    });

    it('设置后刷新 updatedAt', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;
      const oldUpdated = after1!.updatedAt;

      await new Promise((r) => setTimeout(r, 10));
      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'auto' });

      const after2 = await StorageService.getWorkUnit(wu.id);
      expect(after2!.updatedAt > oldUpdated).toBe(true);
    });

    it('Work Unit 不存在时抛错', async () => {
      await expect(
        StorageService.setSlotFillIn('nonexistent', 'slot-1', { method: 'auto' })
      ).rejects.toThrow('不存在');
    });

    it('Slot 不存在时抛错', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await expect(
        StorageService.setSlotFillIn(wu.id, 'nonexistent', { method: 'auto' })
      ).rejects.toThrow('不存在');
    });
  });

  describe('clearSlotFillIn', () => {
    it('清除已有的待补齐声明', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'manual', hint: '手动' });
      await StorageService.clearSlotFillIn(wu.id, slotId);

      const after2 = await StorageService.getWorkUnit(wu.id);
      expect(after2!.slots[0].fillIn).toBeUndefined();
    });

    it('无待补齐声明时清除也不报错', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await expect(
        StorageService.clearSlotFillIn(wu.id, slotId)
      ).resolves.not.toThrow();
    });
  });

  describe('cloneWorkUnit with fillIn', () => {
    it('复制时保留 Slot 的 fillIn 声明', async () => {
      const wu = await StorageService.createWorkUnit('源');
      await StorageService.addSlot(wu.id, { name: '任务目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;
      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'user-confirm', hint: '描述任务' });

      const cloned = await StorageService.cloneWorkUnit(wu.id);

      expect(cloned.slots[0].fillIn).toBeDefined();
      expect(cloned.slots[0].fillIn!.method).toBe('user-confirm');
      expect(cloned.slots[0].fillIn!.hint).toBe('描述任务');
      // cloned slot has different ID
      expect(cloned.slots[0].id).not.toBe(slotId);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/storageService.test.ts`
Expected: FAIL — `StorageService.setSlotFillIn` is not a function.

- [ ] **Step 3: Implement schema v4 + setSlotFillIn + clearSlotFillIn**

In `src/services/StorageService.ts`:

**Add schema v4** after the existing `version(3)` block:

```typescript
    this.version(4).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
    });
    // No data migration needed: fillIn is an optional field inside nested Slot JSON.
    // Existing Slots naturally have fillIn === undefined.
```

**Add import** at top (after existing constraint import):

```typescript
import type { FillInDeclaration } from '../types/fillIn.types';
```

**Add setSlotFillIn** after the Capability CRUD section, before Constraint CRUD:

```typescript
// ---------------------------------------------------------------------------
// Slot FillIn CRUD
// ---------------------------------------------------------------------------

/** 为 Slot 设置待补齐声明 */
async function setSlotFillIn(
  workUnitId: string,
  slotId: string,
  fillIn: FillInDeclaration,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    slot.fillIn = fillIn;

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}

/** 清除 Slot 的待补齐声明 */
async function clearSlotFillIn(
  workUnitId: string,
  slotId: string,
): Promise<void> {
  await db.transaction('rw', db.workUnits, async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const slot = wu.slots.find((s) => s.id === slotId);
    if (!slot) throw new Error(`Slot ${slotId} 不存在`);

    delete slot.fillIn;

    await db.workUnits.update(workUnitId, {
      slots: wu.slots,
      updatedAt: nowISO(),
    });
  });
}
```

**Add to export object:**

```typescript
export const StorageService = {
  // ... existing exports ...
  setSlotFillIn,
  clearSlotFillIn,
  // ... rest ...
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/storageService.test.ts`
Expected: PASS (all existing + 8 new tests)

- [ ] **Step 5: Run full test suite for regression**

Run: `cd /Users/shizheng/Qomo && npx vitest run`
Expected: All 138 + 8 = 146 tests PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/services/StorageService.ts tests/storageService.test.ts
git commit -m "feat(w2c): StorageService schema v4 — setSlotFillIn / clearSlotFillIn + clone 保留 fillIn"
```

---

### Task 3: Extend useWorkUnitEditor Hook

**Files:**
- Modify: `src/hooks/useWorkUnitEditor.ts`

- [ ] **Step 1: Add setSlotFillIn and clearSlotFillIn to hook**

In `src/hooks/useWorkUnitEditor.ts`:

**Add import** at top:

```typescript
import type { FillInDeclaration } from '../types/fillIn.types';
```

**Add to UseWorkUnitEditorReturn interface:**

```typescript
  /** 为 Slot 设置待补齐声明 */
  setSlotFillIn: (slotId: string, fillIn: FillInDeclaration) => Promise<void>;
  /** 清除 Slot 的待补齐声明 */
  clearSlotFillIn: (slotId: string) => Promise<void>;
```

**Add implementations** before the `return` statement:

```typescript
  const setSlotFillIn = useCallback(async (slotId: string, fillIn: FillInDeclaration) => {
    if (!id) return;
    await StorageService.setSlotFillIn(id, slotId, fillIn);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);

  const clearSlotFillIn = useCallback(async (slotId: string) => {
    if (!id) return;
    await StorageService.clearSlotFillIn(id, slotId);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);
```

**Add to return object:**

```typescript
  return {
    // ... existing ...
    setSlotFillIn,
    clearSlotFillIn,
  };
```

- [ ] **Step 2: Run full test suite**

Run: `cd /Users/shizheng/Qomo && npx vitest run`
Expected: All 146 tests PASS (no new tests in this step — hook is tested via component tests in Task 5)

- [ ] **Step 3: Lint check**

Run: `cd /Users/shizheng/Qomo && npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/hooks/useWorkUnitEditor.ts
git commit -m "feat(w2c): useWorkUnitEditor 增加 setSlotFillIn / clearSlotFillIn 方法"
```

---

### Task 4: Add FillIn UI to WorkUnitDetailComponent

**Files:**
- Modify: `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx`
- Modify: `tests/workUnitDetailComponent.test.tsx`

- [ ] **Step 1: Write failing component tests**

Append to `tests/workUnitDetailComponent.test.tsx`:

```typescript
  describe('待补齐声明 UI', () => {
    it('Slot 无 fillIn 时不显示待补齐标签', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '普通Slot', slotType: 'context', required: false });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('普通Slot')).toBeTruthy();
      });
      expect(screen.queryByText('待补齐')).toBeNull();
    });

    it('Slot 有 fillIn 时显示待补齐标签和方式', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标Slot', slotType: 'context', required: true });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.setSlotFillIn(wu.id, after!.slots[0].id, { method: 'user-confirm', hint: '请输入目标' });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('目标Slot')).toBeTruthy();
      });
      expect(screen.getByText('待补齐')).toBeTruthy();
      expect(screen.getByText('user-confirm')).toBeTruthy();
    });

    it('待补齐摘要区域显示正确统计', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: 'Slot1', slotType: 'context', required: true });
      await StorageService.addSlot(wu.id, { name: 'Slot2', slotType: 'rule', required: false });
      await StorageService.addSlot(wu.id, { name: 'Slot3', slotType: 'output', required: false });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.setSlotFillIn(wu.id, after!.slots[0].id, { method: 'auto' });
      await StorageService.setSlotFillIn(wu.id, after!.slots[1].id, { method: 'user-confirm' });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText(/待补齐项/)).toBeTruthy();
      });
      expect(screen.getByText(/2/)).toBeTruthy();
    });

    it('无待补齐项时不显示摘要区域', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: 'Slot1', slotType: 'context', required: false });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('Slot1')).toBeTruthy();
      });
      expect(screen.queryByText(/待补齐项/)).toBeNull();
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/workUnitDetailComponent.test.tsx`
Expected: FAIL — no "待补齐" text rendered.

- [ ] **Step 3: Add FillIn UI to component**

In `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx`:

**Add import** for FillInMethod:

```typescript
import type { SlotType, Slot, Capability, ConstraintType, ConstraintPack, FillInMethod } from '../../types';
```

**Add constants** after existing constant blocks:

```typescript
const fillInMethodLabels: Record<FillInMethod, string> = {
  auto: '自动提取',
  'user-confirm': '用户确认',
  manual: '手动输入',
};

const fillInMethodOptions: FillInMethod[] = ['auto', 'user-confirm', 'manual'];
```

**Add fillInTag style** alongside existing tag styles:

```typescript
const fillInTagStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  background: '#bee3f8',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#2b6cb0',
};

const fillInMethodTagStyle: React.CSSProperties = {
  padding: '0.15rem 0.5rem',
  background: '#e9d8fd',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#6b46c1',
};

const summaryCardStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#ebf8ff',
  borderRadius: '8px',
  marginBottom: '0.75rem',
  border: '1px solid #bee3f8',
};

const summaryHeaderStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '1rem',
  marginBottom: '0.5rem',
  color: '#2b6cb0',
};

const summaryItemStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#4a5568',
  padding: '0.2rem 0',
};
```

**In the Slot header** (inside the `wu.slots.map(...)` render), add fill-in tags after the required tag:

```tsx
{slot.fillIn && <span style={fillInTagStyle}>待补齐</span>}
{slot.fillIn && <span style={fillInMethodTagStyle}>{slot.fillIn.method}</span>}
```

**After the constraint list** (before the closing `</div>` of the component), add the fill-in summary section:

```tsx
      {/* 待补齐摘要 */}
      {(() => {
        const fillInSlots = wu.slots.filter((s) => s.fillIn);
        if (fillInSlots.length === 0) return null;

        const byMethod: Record<string, typeof fillInSlots> = {};
        for (const s of fillInSlots) {
          const m = s.fillIn!.method;
          if (!byMethod[m]) byMethod[m] = [];
          byMethod[m].push(s);
        }

        return (
          <>
            <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                待补齐项 ({fillInSlots.length})
              </span>
            </div>
            <div style={summaryCardStyle}>
              <div style={summaryHeaderStyle}>待补齐摘要</div>
              {fillInMethodOptions.map((method) => {
                const slots = byMethod[method];
                if (!slots || slots.length === 0) return null;
                return (
                  <div key={method} style={summaryItemStyle}>
                    <span style={fillInMethodTagStyle}>{fillInMethodLabels[method]}</span>
                    {' '}({slots.length}): {slots.map((s) => s.name).join('、')}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/workUnitDetailComponent.test.tsx`
Expected: PASS (all existing + 4 new)

- [ ] **Step 5: Run full test suite + lint + build**

Run: `cd /Users/shizheng/Qomo && npx vitest run && npm run lint && npm run build`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx tests/workUnitDetailComponent.test.tsx
git commit -m "feat(w2c): 待补齐 UI — Slot 标签 + 摘要区域"
```

---

### Task 5: Final Verification & Story Completion

**Files:**
- Modify: `docs/implementation-artifacts/w2c-runtime-fill-ins-semantics-declaration.md`
- Modify: `docs/implementation-artifacts/sprint-status.yaml`

- [ ] **Step 1: Run complete verification**

Run: `cd /Users/shizheng/Qomo && npm run lint && npm run build && npx vitest run`
Expected: All pass. Note final test count.

- [ ] **Step 2: Update story file with completion details**

Update the File List section in `docs/implementation-artifacts/w2c-runtime-fill-ins-semantics-declaration.md` with actual files created/modified and test count.

Update Status from `ready-for-dev` to `done`.

- [ ] **Step 3: Commit story completion**

```bash
cd /Users/shizheng/Qomo
git add docs/implementation-artifacts/w2c-runtime-fill-ins-semantics-declaration.md
git commit -m "docs(w2c): 标记 story 完成，更新文件清单"
```
