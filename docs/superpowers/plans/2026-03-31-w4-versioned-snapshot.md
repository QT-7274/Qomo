# W4: 版本化快照与继续编辑连续性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add version history to Work Units — create immutable snapshots, list history, restore from any snapshot, auto-cleanup at 5-version limit.

**Architecture:** New `workUnitVersions` Dexie table stores serialized Work Unit content as JSON strings with content hash. `createSnapshot()` serializes current state, `restoreSnapshot()` overwrites current WU with stored content. Exposed via hook, rendered as a version history panel in the detail component.

**Tech Stack:** React 18, TypeScript, Dexie (IndexedDB), Vitest, @testing-library/react, fake-indexeddb

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/services/StorageService.ts` | Modify | Schema v5 + `WorkUnitVersionRecord` + snapshot CRUD |
| `src/hooks/useWorkUnitEditor.ts` | Modify | Expose snapshot methods |
| `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx` | Modify | Version history UI panel |
| `tests/storageService.test.ts` | Modify | Snapshot CRUD tests |
| `tests/workUnitDetailComponent.test.tsx` | Modify | Version history UI tests |

---

### Task 1: StorageService Snapshot CRUD — Tests & Implementation

**Files:**
- Modify: `src/services/StorageService.ts`
- Modify: `tests/storageService.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/storageService.test.ts`:

```typescript
  describe('createSnapshot', () => {
    it('创建快照并返回版本记录', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.addCapability(wu.id, after!.slots[0].id, { name: 'C', content: '内容' });

      const snapshot = await StorageService.createSnapshot(wu.id);

      expect(snapshot.id).toBeTruthy();
      expect(snapshot.workUnitId).toBe(wu.id);
      expect(snapshot.versionNumber).toBe(1);
      expect(snapshot.contentHash).toBeTruthy();
      expect(snapshot.createdAt).toBeTruthy();
      const parsed = JSON.parse(snapshot.content);
      expect(parsed.name).toBe('测试');
      expect(parsed.slots).toHaveLength(1);
    });

    it('版本号自增', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const s1 = await StorageService.createSnapshot(wu.id);
      const s2 = await StorageService.createSnapshot(wu.id);
      expect(s1.versionNumber).toBe(1);
      expect(s2.versionNumber).toBe(2);
    });

    it('超过 5 个快照自动清理最旧', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      for (let i = 0; i < 6; i++) {
        await StorageService.createSnapshot(wu.id);
      }
      const list = await StorageService.listSnapshots(wu.id);
      expect(list).toHaveLength(5);
      // 最旧的（versionNumber=1）应被删除
      expect(list.every((s) => s.versionNumber >= 2)).toBe(true);
    });

    it('相同内容生成相同哈希', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const s1 = await StorageService.createSnapshot(wu.id);
      const s2 = await StorageService.createSnapshot(wu.id);
      expect(s1.contentHash).toBe(s2.contentHash);
    });

    it('不同内容生成不同哈希', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const s1 = await StorageService.createSnapshot(wu.id);
      await StorageService.updateWorkUnitInfo(wu.id, { name: '已修改' });
      const s2 = await StorageService.createSnapshot(wu.id);
      expect(s1.contentHash).not.toBe(s2.contentHash);
    });

    it('Work Unit 不存在时抛错', async () => {
      await expect(StorageService.createSnapshot('nonexistent')).rejects.toThrow('不存在');
    });
  });

  describe('listSnapshots', () => {
    it('按时间倒序返回', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.createSnapshot(wu.id);
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.createSnapshot(wu.id);

      const list = await StorageService.listSnapshots(wu.id);
      expect(list).toHaveLength(2);
      expect(list[0].versionNumber).toBe(2);
      expect(list[1].versionNumber).toBe(1);
    });

    it('无快照返回空数组', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const list = await StorageService.listSnapshots(wu.id);
      expect(list).toEqual([]);
    });
  });

  describe('restoreSnapshot', () => {
    it('恢复快照覆盖当前内容', async () => {
      const wu = await StorageService.createWorkUnit('原始');
      await StorageService.addSlot(wu.id, { name: '原始Slot', slotType: 'context', required: true });
      await StorageService.createSnapshot(wu.id);

      // 修改内容
      await StorageService.updateWorkUnitInfo(wu.id, { name: '已修改', description: '新描述' });

      // 获取快照列表
      const list = await StorageService.listSnapshots(wu.id);
      await StorageService.restoreSnapshot(wu.id, list[0].id);

      const restored = await StorageService.getWorkUnit(wu.id);
      expect(restored!.name).toBe('原始');
      expect(restored!.slots).toHaveLength(1);
      expect(restored!.slots[0].name).toBe('原始Slot');
    });

    it('恢复后 updatedAt 刷新', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.createSnapshot(wu.id);
      const before = await StorageService.getWorkUnit(wu.id);

      await new Promise((r) => setTimeout(r, 10));
      const list = await StorageService.listSnapshots(wu.id);
      await StorageService.restoreSnapshot(wu.id, list[0].id);

      const after = await StorageService.getWorkUnit(wu.id);
      expect(after!.updatedAt > before!.updatedAt).toBe(true);
    });

    it('快照不存在时抛错', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await expect(StorageService.restoreSnapshot(wu.id, 'nonexistent')).rejects.toThrow('不存在');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/storageService.test.ts`
Expected: FAIL — `StorageService.createSnapshot` is not a function.

- [ ] **Step 3: Implement schema v5 + snapshot CRUD**

In `src/services/StorageService.ts`:

**Add WorkUnitVersionRecord interface** after `WorkUnitRecord`:

```typescript
/** 版本快照记录 */
export interface WorkUnitVersionRecord {
  /** 快照唯一 ID */
  id: string;
  /** 所属 Work Unit ID */
  workUnitId: string;
  /** 自增版本号 */
  versionNumber: number;
  /** 序列化内容的哈希 */
  contentHash: string;
  /** 序列化的 JSON 内容 */
  content: string;
  /** 创建时间 */
  createdAt: ISO8601;
}
```

**Add table to QomoDatabase class:**

```typescript
  workUnitVersions!: EntityTable<WorkUnitVersionRecord, 'id'>;
```

**Add schema v5** in constructor:

```typescript
    this.version(5).stores({
      workUnits: 'id, name, sourceType, createdAt, updatedAt',
      workUnitVersions: 'id, workUnitId, createdAt',
    });
```

**Add simple hash function:**

```typescript
/** 简单字符串哈希（用于内容比较，非加密） */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36);
}
```

**Add snapshot CRUD** (new section after clone):

```typescript
// ---------------------------------------------------------------------------
// Version Snapshots
// ---------------------------------------------------------------------------

const MAX_SNAPSHOTS = 5;

/** 创建版本快照 */
async function createSnapshot(workUnitId: string): Promise<WorkUnitVersionRecord> {
  let record: WorkUnitVersionRecord | undefined;

  await db.transaction('rw', [db.workUnits, db.workUnitVersions], async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    // 序列化内容
    const contentObj = {
      name: wu.name,
      description: wu.description,
      slots: wu.slots,
      constraints: wu.constraints,
    };
    const content = JSON.stringify(contentObj);
    const contentHash = simpleHash(content);

    // 计算版本号
    const existing = await db.workUnitVersions
      .where('workUnitId').equals(workUnitId)
      .sortBy('createdAt');
    const maxVersion = existing.length > 0
      ? Math.max(...existing.map((s) => s.versionNumber))
      : 0;

    record = {
      id: generateId(),
      workUnitId,
      versionNumber: maxVersion + 1,
      contentHash,
      content,
      createdAt: nowISO(),
    };

    await db.workUnitVersions.add(record);

    // 超过上限清理最旧
    if (existing.length >= MAX_SNAPSHOTS) {
      const toDelete = existing.slice(0, existing.length - MAX_SNAPSHOTS + 1);
      await db.workUnitVersions.bulkDelete(toDelete.map((s) => s.id));
    }
  });

  return record!;
}

/** 列出版本快照（按时间倒序） */
async function listSnapshots(workUnitId: string): Promise<WorkUnitVersionRecord[]> {
  const list = await db.workUnitVersions
    .where('workUnitId').equals(workUnitId)
    .sortBy('createdAt');
  return list.reverse();
}

/** 从快照恢复 Work Unit 内容 */
async function restoreSnapshot(workUnitId: string, snapshotId: string): Promise<void> {
  await db.transaction('rw', [db.workUnits, db.workUnitVersions], async () => {
    const wu = await db.workUnits.get(workUnitId);
    if (!wu) throw new Error(`Work Unit ${workUnitId} 不存在`);

    const snapshot = await db.workUnitVersions.get(snapshotId);
    if (!snapshot) throw new Error(`快照 ${snapshotId} 不存在`);

    const parsed = JSON.parse(snapshot.content);

    await db.workUnits.update(workUnitId, {
      name: parsed.name,
      description: parsed.description,
      slots: parsed.slots,
      constraints: parsed.constraints,
      updatedAt: nowISO(),
    });
  });
}
```

**Add to export object:**

```typescript
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/storageService.test.ts`
Expected: PASS

- [ ] **Step 5: Run full suite for regression**

Run: `cd /Users/shizheng/Qomo && npx vitest run`
Expected: 167 + ~12 = ~179 tests PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/services/StorageService.ts tests/storageService.test.ts
git commit -m "feat(w4): StorageService schema v5 — 版本快照 createSnapshot / listSnapshots / restoreSnapshot"
```

---

### Task 2: Hook Extension + Version History UI + Tests

**Files:**
- Modify: `src/hooks/useWorkUnitEditor.ts`
- Modify: `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx`
- Modify: `tests/workUnitDetailComponent.test.tsx`

- [ ] **Step 1: Extend hook**

In `src/hooks/useWorkUnitEditor.ts`:

**Add import:**
```typescript
import type { WorkUnitVersionRecord } from '../services/StorageService';
```

**Add to interface:**
```typescript
  /** 创建快照 */
  createSnapshot: () => Promise<void>;
  /** 列出快照 */
  listSnapshots: () => Promise<WorkUnitVersionRecord[]>;
  /** 恢复快照 */
  restoreSnapshot: (snapshotId: string) => Promise<void>;
```

**Add implementations:**
```typescript
  const createSnapshot = useCallback(async () => {
    if (!id) return;
    await StorageService.createSnapshot(id);
  }, [id]);

  const listSnapshots = useCallback(async (): Promise<WorkUnitVersionRecord[]> => {
    if (!id) return [];
    return StorageService.listSnapshots(id);
  }, [id]);

  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    if (!id) return;
    await StorageService.restoreSnapshot(id, snapshotId);
    await fetchWorkUnit();
  }, [id, fetchWorkUnit]);
```

**Add to return:**
```typescript
    createSnapshot,
    listSnapshots,
    restoreSnapshot,
```

- [ ] **Step 2: Write failing component tests**

Append to `tests/workUnitDetailComponent.test.tsx`:

```typescript
  describe('版本历史', () => {
    it('显示版本历史区域标题', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText(/版本历史/)).toBeTruthy();
      });
    });

    it('创建快照后版本列表更新', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: 'S', slotType: 'context', required: false });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('创建快照')).toBeTruthy();
      });
      fireEvent.click(screen.getByText('创建快照'));

      await waitFor(() => {
        expect(screen.getByText(/v1/)).toBeTruthy();
      });
    });

    it('无快照时显示空提示', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('暂无版本快照')).toBeTruthy();
      });
    });
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/workUnitDetailComponent.test.tsx`

- [ ] **Step 4: Add version history UI**

In `src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx`:

**Add import:**
```typescript
import type { WorkUnitVersionRecord } from '../../services/StorageService';
```

**Add state** (after preview state):
```typescript
  // 版本历史状态
  const [snapshots, setSnapshots] = useState<WorkUnitVersionRecord[]>([]);
  const [snapshotsLoaded, setSnapshotsLoaded] = useState(false);
```

**Add load effect** (after existing useEffect or inside useEffect logic — or as new effect after state):
```typescript
  // 加载版本历史
  const loadSnapshots = async () => {
    const list = await editor.listSnapshots();
    setSnapshots(list);
    setSnapshotsLoaded(true);
  };
```

**Add to the existing wu load effect area** — call `loadSnapshots()` when wu loads. Or add an effect:
Actually, simplest approach: load snapshots on mount and after actions. Add a `useEffect`:

```typescript
  useEffect(() => {
    if (editor.workUnit) {
      loadSnapshots();
    }
  }, [editor.workUnit]);
```

**Add handlers:**
```typescript
  const handleCreateSnapshot = async () => {
    await editor.createSnapshot();
    await loadSnapshots();
  };

  const handleRestoreSnapshot = async (snapshotId: string, versionNumber: number) => {
    if (window.confirm(`确认恢复到版本 v${versionNumber}？当前未保存的修改将被覆盖。`)) {
      await editor.restoreSnapshot(snapshotId);
      await loadSnapshots();
    }
  };
```

**Add JSX** after the preview section, before closing `</div>`:

```tsx
      {/* 版本历史 */}
      <div style={{ ...sectionHeaderStyle, marginTop: '2rem' }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          版本历史 ({snapshots.length})
        </span>
        <button type="button" style={btnPrimary} onClick={handleCreateSnapshot}>
          创建快照
        </button>
      </div>

      {snapshotsLoaded && snapshots.length === 0 && (
        <p style={emptyHintStyle}>暂无版本快照</p>
      )}

      {snapshots.map((snap) => (
        <div key={snap.id} style={versionRowStyle}>
          <span style={{ fontWeight: 600 }}>v{snap.versionNumber}</span>
          <span style={metaTextStyle}>{snap.createdAt.slice(0, 19).replace('T', ' ')}</span>
          <span style={tagStyle}>{snap.contentHash}</span>
          <button
            type="button"
            style={btnSecondary}
            onClick={() => handleRestoreSnapshot(snap.id, snap.versionNumber)}
          >
            恢复
          </button>
        </div>
      ))}
```

**Add style:**
```typescript
const versionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 0.75rem',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/shizheng/Qomo && npx vitest run tests/workUnitDetailComponent.test.tsx`

- [ ] **Step 6: Run full suite + lint + build**

Run: `cd /Users/shizheng/Qomo && npx vitest run && npm run lint && npm run build`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/shizheng/Qomo
git add src/hooks/useWorkUnitEditor.ts src/components/WorkUnitDetail/WorkUnitDetailComponent.tsx tests/workUnitDetailComponent.test.tsx
git commit -m "feat(w4): 版本历史 UI — 创建快照 + 版本列表 + 恢复"
```

---

### Task 3: Final Verification & Story Completion

- [ ] **Step 1: Full verification**

Run: `cd /Users/shizheng/Qomo && npm run lint && npm run build && npx vitest run`

- [ ] **Step 2: Update story + sprint status**

Mark `w4-versioned-snapshot-and-editing-continuity` as `done`.

- [ ] **Step 3: Commit**

```bash
cd /Users/shizheng/Qomo
git add docs/implementation-artifacts/w4-versioned-snapshot-and-editing-continuity.md docs/implementation-artifacts/sprint-status.yaml
git commit -m "docs(w4): 标记 story 完成，更新文件清单"
```
