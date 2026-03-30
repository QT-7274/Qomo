/**
 * B0.1 任务 5：WorkUnitSnapshotIdentityCard 渲染测试
 *
 * 验证演示组件能正确渲染 WorkUnitSnapshot 数据。
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkUnitSnapshotIdentityCard } from '../src/components/WorkUnitSnapshotIdentityCard';
import {
  buildWorkUnitSnapshot,
  createWorkUnitIdentity,
  createSnapshotIdentity,
  createCloneLineage,
} from '../src/utils/workUnitSnapshotHelper';
import type { WorkUnitSnapshot } from '../src/types/workUnit.types';

describe('WorkUnitSnapshotIdentityCard - Rendering', () => {
  it('should render fresh snapshot identity fields', () => {
    const snapshot = buildWorkUnitSnapshot({
      name: '测试工作单元',
      description: '测试描述',
      contentHash: 'sha256_test',
    });

    render(<WorkUnitSnapshotIdentityCard snapshot={snapshot} />);

    expect(screen.getByText('测试工作单元')).toBeDefined();
    expect(screen.getByText('测试描述')).toBeDefined();
    expect(screen.getByText('全新创建')).toBeDefined();
    expect(screen.getByText('sha256_test')).toBeDefined();
    expect(screen.getByText('1.0.0')).toBeDefined();
  });

  it('should render cloned snapshot with source reference', () => {
    const identity = createWorkUnitIdentity('克隆单元');
    const snap = createSnapshotIdentity(identity.workUnitId, '1.0.0', 'hash_clone');
    const lineage = createCloneLineage('wu_parent_001', '2.0.0', identity.workUnitId);
    const snapshot: WorkUnitSnapshot = { identity, snapshot: snap, lineage };

    render(<WorkUnitSnapshotIdentityCard snapshot={snapshot} />);

    expect(screen.getByText('克隆单元')).toBeDefined();
    expect(screen.getByText('从其它 Work Unit 克隆')).toBeDefined();
    expect(screen.getByText('wu_parent_001')).toBeDefined();
  });
});
