/**
 * B0.1 任务 1：共享对象身份 contract 类型验证
 *
 * 验证 WorkUnitSnapshot 的三层身份语义：
 * - 逻辑身份（workUnitId）
 * - 快照/版本身份（snapshotId, versionId）
 * - 谱系引用（lineage）
 */
import { describe, it, expect } from 'vitest';
import type {
  WorkUnitIdentity,
  SnapshotIdentity,
  LineageReference,
  WorkUnitSnapshot,
} from '../src/types/workUnit.types';

describe('WorkUnit Types - Logical Identity', () => {
  it('should define WorkUnitIdentity with a stable workUnitId', () => {
    const identity: WorkUnitIdentity = {
      workUnitId: 'wu_a1b2c3d4-e5f6-4789',
      name: '代码审查助手',
      description: '用于代码审查的工作单元',
      createdAt: '2026-03-30T10:00:00Z',
    };

    expect(identity.workUnitId).toBeDefined();
    expect(identity.name).toBe('代码审查助手');
    expect(identity.createdAt).toBeDefined();
  });
});

describe('WorkUnit Types - Snapshot/Version Identity', () => {
  it('should define SnapshotIdentity with version fields', () => {
    const snapshot: SnapshotIdentity = {
      snapshotId: 'wu_a1b2c3d4-e5f6-4789#v1.0.0',
      versionId: 'ver_001',
      versionNumber: '1.0.0',
      createdAt: '2026-03-30T10:00:00Z',
      contentHash: 'sha256_abc123',
      previousVersionId: null,
    };

    expect(snapshot.snapshotId).toContain('#v');
    expect(snapshot.versionNumber).toBe('1.0.0');
    expect(snapshot.previousVersionId).toBeNull();
  });

  it('should support version chaining via previousVersionId', () => {
    const v2: SnapshotIdentity = {
      snapshotId: 'wu_a1b2c3d4-e5f6-4789#v1.1.0',
      versionId: 'ver_002',
      versionNumber: '1.1.0',
      createdAt: '2026-03-30T11:00:00Z',
      contentHash: 'sha256_def456',
      previousVersionId: 'ver_001',
    };

    expect(v2.previousVersionId).toBe('ver_001');
  });
});

describe('WorkUnit Types - Lineage References', () => {
  it('should express fresh creation lineage', () => {
    const lineage: LineageReference = {
      sourceType: 'created_new',
      sourceWorkUnitId: null,
      lineagePath: [],
    };

    expect(lineage.sourceType).toBe('created_new');
    expect(lineage.sourceWorkUnitId).toBeNull();
  });

  it('should express clone lineage with sourceWorkUnitId', () => {
    const lineage: LineageReference = {
      sourceType: 'cloned_from',
      sourceWorkUnitId: 'wu_parent_123',
      lineagePath: [
        {
          workUnitId: 'wu_parent_123',
          versionNumber: '1.0.0',
          action: 'created',
          timestamp: '2026-03-20T10:00:00Z',
        },
        {
          workUnitId: 'wu_child_456',
          versionNumber: '1.0.0',
          action: 'cloned',
          timestamp: '2026-03-30T10:00:00Z',
        },
      ],
    };

    expect(lineage.sourceType).toBe('cloned_from');
    expect(lineage.sourceWorkUnitId).toBe('wu_parent_123');
    expect(lineage.lineagePath).toHaveLength(2);
    expect(lineage.lineagePath[1].action).toBe('cloned');
  });
});

describe('WorkUnit Types - WorkUnitSnapshot composite', () => {
  it('should compose identity + snapshot + lineage into WorkUnitSnapshot', () => {
    const snapshot: WorkUnitSnapshot = {
      identity: {
        workUnitId: 'wu_test_001',
        name: '测试工作单元',
        createdAt: '2026-03-30T10:00:00Z',
      },
      snapshot: {
        snapshotId: 'wu_test_001#v1.0.0',
        versionId: 'ver_snap_001',
        versionNumber: '1.0.0',
        createdAt: '2026-03-30T10:00:00Z',
        contentHash: 'sha256_test',
        previousVersionId: null,
      },
      lineage: {
        sourceType: 'created_new',
        sourceWorkUnitId: null,
        lineagePath: [],
      },
    };

    expect(snapshot.identity.workUnitId).toBe('wu_test_001');
    expect(snapshot.snapshot.snapshotId).toBe('wu_test_001#v1.0.0');
    expect(snapshot.lineage.sourceType).toBe('created_new');
  });
});
