/**
 * B0.1 任务 2：快照/版本/谱系相关 helper 函数测试
 *
 * 验证创建、归一化、格式化引用信息的 helper：
 * - 创建新 WorkUnitSnapshot
 * - 创建克隆的 WorkUnitSnapshot
 * - 格式化 snapshotId
 * - 历史版本恢复
 */
import { describe, it, expect } from 'vitest';
import {
  createWorkUnitIdentity,
  createSnapshotIdentity,
  createFreshLineage,
  createCloneLineage,
  createRestoredLineage,
  buildWorkUnitSnapshot,
  formatSnapshotId,
} from '../src/utils/workUnitSnapshotHelper';

describe('workUnitSnapshotHelper - Identity Creation', () => {
  it('should create a WorkUnitIdentity with generated workUnitId', () => {
    const identity = createWorkUnitIdentity('测试单元');

    expect(identity.workUnitId).toBeDefined();
    expect(identity.workUnitId.length).toBeGreaterThan(0);
    expect(identity.name).toBe('测试单元');
    expect(identity.createdAt).toBeDefined();
  });

  it('should create unique workUnitIds each time', () => {
    const a = createWorkUnitIdentity('A');
    const b = createWorkUnitIdentity('B');

    expect(a.workUnitId).not.toBe(b.workUnitId);
  });

  it('should accept optional description', () => {
    const identity = createWorkUnitIdentity('名称', '描述信息');

    expect(identity.description).toBe('描述信息');
  });
});

describe('workUnitSnapshotHelper - Snapshot Creation', () => {
  it('should create a SnapshotIdentity for initial version', () => {
    const snapshot = createSnapshotIdentity('wu_test_001', '1.0.0', 'hash_abc');

    expect(snapshot.snapshotId).toBe('wu_test_001#v1.0.0');
    expect(snapshot.versionNumber).toBe('1.0.0');
    expect(snapshot.contentHash).toBe('hash_abc');
    expect(snapshot.previousVersionId).toBeNull();
    expect(snapshot.versionId).toBeDefined();
  });

  it('should support version chaining via previousVersionId', () => {
    const v1 = createSnapshotIdentity('wu_test_001', '1.0.0', 'hash_1');
    const v2 = createSnapshotIdentity('wu_test_001', '1.1.0', 'hash_2', v1.versionId);

    expect(v2.previousVersionId).toBe(v1.versionId);
    expect(v2.snapshotId).toBe('wu_test_001#v1.1.0');
  });
});

describe('workUnitSnapshotHelper - Lineage Creation', () => {
  it('should create fresh lineage (created_new)', () => {
    const lineage = createFreshLineage();

    expect(lineage.sourceType).toBe('created_new');
    expect(lineage.sourceWorkUnitId).toBeNull();
    expect(lineage.lineagePath).toHaveLength(0);
  });

  it('should create clone lineage with source reference', () => {
    const lineage = createCloneLineage('wu_parent_001', '2.0.0', 'wu_child_002');

    expect(lineage.sourceType).toBe('cloned_from');
    expect(lineage.sourceWorkUnitId).toBe('wu_parent_001');
    expect(lineage.lineagePath).toHaveLength(1);
    expect(lineage.lineagePath[0].action).toBe('cloned');
    expect(lineage.lineagePath[0].workUnitId).toBe('wu_child_002');
  });

  it('should create restored lineage from history version', () => {
    const lineage = createRestoredLineage('wu_original_001', '1.0.0', 'wu_restored_002');

    expect(lineage.sourceType).toBe('restored_from');
    expect(lineage.sourceWorkUnitId).toBe('wu_original_001');
    expect(lineage.lineagePath).toHaveLength(1);
    expect(lineage.lineagePath[0].action).toBe('restored');
  });
});

describe('workUnitSnapshotHelper - Composite Builder', () => {
  it('should build a complete fresh WorkUnitSnapshot', () => {
    const snapshot = buildWorkUnitSnapshot({
      name: '全新工作单元',
      contentHash: 'sha256_fresh',
    });

    expect(snapshot.identity.workUnitId).toBeDefined();
    expect(snapshot.identity.name).toBe('全新工作单元');
    expect(snapshot.snapshot.versionNumber).toBe('1.0.0');
    expect(snapshot.snapshot.contentHash).toBe('sha256_fresh');
    expect(snapshot.lineage.sourceType).toBe('created_new');
  });
});

describe('workUnitSnapshotHelper - formatSnapshotId', () => {
  it('should format snapshotId from workUnitId and version', () => {
    expect(formatSnapshotId('wu_abc', '1.0.0')).toBe('wu_abc#v1.0.0');
  });

  it('should handle various version formats', () => {
    expect(formatSnapshotId('wu_abc', '2.1.3')).toBe('wu_abc#v2.1.3');
  });
});
