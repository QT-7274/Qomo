/**
 * Launch 相关 StorageService 测试
 *
 * V1 Story: recordRecentLaunch / listRecentLaunches / getLatestSnapshot
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/services/StorageService';

beforeEach(async () => {
  await StorageService._db.workUnits.clear();
  await StorageService._db.workUnitVersions.clear();
  await StorageService._db.recentLaunches.clear();
});

describe('recordRecentLaunch', () => {
  it('记录新的最近使用', async () => {
    await StorageService.recordRecentLaunch('wu-1', 'Test WU');
    const list = await StorageService.listRecentLaunches();
    expect(list).toHaveLength(1);
    expect(list[0].workUnitId).toBe('wu-1');
    expect(list[0].workUnitName).toBe('Test WU');
  });

  it('更新已有记录的时间和名称', async () => {
    await StorageService.recordRecentLaunch('wu-1', 'Old Name');
    const before = await StorageService.listRecentLaunches();
    const oldTime = before[0].lastLaunchedAt;

    // 确保时间差异
    await new Promise((r) => setTimeout(r, 10));

    await StorageService.recordRecentLaunch('wu-1', 'New Name');
    const after = await StorageService.listRecentLaunches();
    expect(after).toHaveLength(1);
    expect(after[0].workUnitName).toBe('New Name');
    expect(after[0].lastLaunchedAt >= oldTime).toBe(true);
  });

  it('多个不同 WU 各自独立记录', async () => {
    await StorageService.recordRecentLaunch('wu-1', 'WU 1');
    await StorageService.recordRecentLaunch('wu-2', 'WU 2');
    await StorageService.recordRecentLaunch('wu-3', 'WU 3');
    const list = await StorageService.listRecentLaunches();
    expect(list).toHaveLength(3);
  });
});

describe('listRecentLaunches', () => {
  it('按 lastLaunchedAt 倒序返回', async () => {
    await StorageService.recordRecentLaunch('wu-1', 'WU 1');
    await new Promise((r) => setTimeout(r, 10));
    await StorageService.recordRecentLaunch('wu-2', 'WU 2');
    await new Promise((r) => setTimeout(r, 10));
    await StorageService.recordRecentLaunch('wu-3', 'WU 3');

    const list = await StorageService.listRecentLaunches();
    expect(list[0].workUnitId).toBe('wu-3');
    expect(list[1].workUnitId).toBe('wu-2');
    expect(list[2].workUnitId).toBe('wu-1');
  });

  it('limit 参数限制返回条数', async () => {
    for (let i = 0; i < 5; i++) {
      await StorageService.recordRecentLaunch(`wu-${i}`, `WU ${i}`);
      await new Promise((r) => setTimeout(r, 5));
    }
    const list = await StorageService.listRecentLaunches(3);
    expect(list).toHaveLength(3);
  });
});

describe('最近使用上限清理', () => {
  it('超过 10 条时自动删除最旧的', async () => {
    for (let i = 0; i < 12; i++) {
      await StorageService.recordRecentLaunch(`wu-${i}`, `WU ${i}`);
      await new Promise((r) => setTimeout(r, 5));
    }
    const list = await StorageService.listRecentLaunches();
    expect(list.length).toBeLessThanOrEqual(10);
    // 最旧的 wu-0, wu-1 应该被清理
    const ids = list.map((r) => r.workUnitId);
    expect(ids).not.toContain('wu-0');
    expect(ids).not.toContain('wu-1');
  });
});

describe('getLatestSnapshot', () => {
  it('有快照时返回最新快照', async () => {
    const wu = await StorageService.createWorkUnit('Snapshot Test');
    await StorageService.createSnapshot(wu.id);
    await new Promise((r) => setTimeout(r, 10));
    const snap2 = await StorageService.createSnapshot(wu.id);

    const latest = await StorageService.getLatestSnapshot(wu.id);
    expect(latest).toBeDefined();
    expect(latest!.id).toBe(snap2.id);
    expect(latest!.versionNumber).toBe(2);
  });

  it('无快照时返回 undefined', async () => {
    const wu = await StorageService.createWorkUnit('No Snapshot');
    const latest = await StorageService.getLatestSnapshot(wu.id);
    expect(latest).toBeUndefined();
  });

  it('快照包含完整内容', async () => {
    const wu = await StorageService.createWorkUnit('Content Test');
    await StorageService.addSlot(wu.id, {
      name: 'Context Slot',
      slotType: 'context',
      required: true,
    });
    await StorageService.createSnapshot(wu.id);

    const latest = await StorageService.getLatestSnapshot(wu.id);
    expect(latest).toBeDefined();
    const content = JSON.parse(latest!.content);
    expect(content.name).toBe('Content Test');
    expect(content.slots).toHaveLength(1);
    expect(content.slots[0].name).toBe('Context Slot');
  });
});
