/**
 * capabilityAvailabilityUtil 测试
 *
 * V3a Story: 能力可用性判定 + 汇总。
 */

import { describe, it, expect } from 'vitest';
import {
  assessCapabilityAvailability,
  summarizeAvailability,
} from '../src/utils/capabilityAvailabilityUtil';
import type { Slot } from '../src/types/slot.types';
import type { Capability } from '../src/types/capability.types';
import type { CapabilityAvailabilityItem } from '../src/types/capabilityAvailability.types';

// ---------------------------------------------------------------------------
// 测试数据
// ---------------------------------------------------------------------------

function makeCap(overrides: Partial<Capability> & { id: string; name: string }): Capability {
  return { content: '', order: 0, ...overrides };
}

function makeSlot(overrides: Partial<Slot> & { id: string; name: string }): Slot {
  return {
    slotType: 'context',
    required: false,
    capabilities: [],
    ...overrides,
  };
}

const capWithContent = makeCap({ id: 'cap-1', name: '代码审查规则', content: '请遵循以下审查标准…' });
const capEmpty = makeCap({ id: 'cap-2', name: '调试工具', content: '' });
const capWhitespace = makeCap({ id: 'cap-3', name: '空白内容', content: '   ' });

const slotWithMixed = makeSlot({
  id: 'slot-1',
  name: '规则 Slot',
  capabilities: [capWithContent, capEmpty],
});

const slotWithAllReady = makeSlot({
  id: 'slot-2',
  name: '上下文 Slot',
  capabilities: [capWithContent],
});

const slotNoCaps = makeSlot({
  id: 'slot-3',
  name: '空 Slot',
  capabilities: [],
});

const slotWhitespace = makeSlot({
  id: 'slot-4',
  name: '空白 Slot',
  capabilities: [capWhitespace],
});

// ---------------------------------------------------------------------------
// assessCapabilityAvailability
// ---------------------------------------------------------------------------

describe('assessCapabilityAvailability', () => {
  it('content 非空 → ready', () => {
    const items = assessCapabilityAvailability([slotWithAllReady]);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('ready');
    expect(items[0].issueType).toBeUndefined();
  });

  it('content 空 → missing', () => {
    const slot = makeSlot({ id: 's', name: 'S', capabilities: [capEmpty] });
    const items = assessCapabilityAvailability([slot]);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('missing');
    expect(items[0].issueType).toBe('missing');
    expect(items[0].description).toBeTruthy();
  });

  it('content 纯空白 → missing', () => {
    const items = assessCapabilityAvailability([slotWhitespace]);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('missing');
  });

  it('混合 Slot — ready + missing', () => {
    const items = assessCapabilityAvailability([slotWithMixed]);
    expect(items).toHaveLength(2);
    expect(items[0].status).toBe('ready');
    expect(items[1].status).toBe('missing');
  });

  it('无 Capability 的 Slot 不产生 item', () => {
    const items = assessCapabilityAvailability([slotNoCaps]);
    expect(items).toHaveLength(0);
  });

  it('空 slots 返回空数组', () => {
    expect(assessCapabilityAvailability([])).toEqual([]);
  });

  it('正确关联 slotId / slotName', () => {
    const items = assessCapabilityAvailability([slotWithAllReady]);
    expect(items[0].slotId).toBe('slot-2');
    expect(items[0].slotName).toBe('上下文 Slot');
    expect(items[0].capabilityId).toBe('cap-1');
    expect(items[0].capabilityName).toBe('代码审查规则');
  });

  it('多个 Slot 全部遍历', () => {
    const items = assessCapabilityAvailability([slotWithMixed, slotWithAllReady, slotNoCaps]);
    expect(items).toHaveLength(3); // 2 from mixed + 1 from allReady + 0 from noCaps
  });
});

// ---------------------------------------------------------------------------
// summarizeAvailability
// ---------------------------------------------------------------------------

describe('summarizeAvailability', () => {
  it('正确统计 ready / blocked / ambiguous', () => {
    const items: CapabilityAvailabilityItem[] = [
      { capabilityId: '1', capabilityName: 'A', slotId: 's1', slotName: 'S1', status: 'ready' },
      { capabilityId: '2', capabilityName: 'B', slotId: 's1', slotName: 'S1', status: 'missing', issueType: 'missing' },
      { capabilityId: '3', capabilityName: 'C', slotId: 's2', slotName: 'S2', status: 'version_incompatible', issueType: 'version_incompatible' },
      { capabilityId: '4', capabilityName: 'D', slotId: 's2', slotName: 'S2', status: 'ambiguous_candidate', issueType: 'ambiguous_candidate' },
      { capabilityId: '5', capabilityName: 'E', slotId: 's3', slotName: 'S3', status: 'permission_denied', issueType: 'permission_denied' },
    ];

    const summary = summarizeAvailability(items);
    expect(summary.readyCount).toBe(1);
    expect(summary.blockedCount).toBe(3); // missing + version_incompatible + permission_denied
    expect(summary.ambiguousCount).toBe(1);
    expect(summary.items).toBe(items);
  });

  it('空列表 → 全零', () => {
    const summary = summarizeAvailability([]);
    expect(summary.readyCount).toBe(0);
    expect(summary.blockedCount).toBe(0);
    expect(summary.ambiguousCount).toBe(0);
    expect(summary.items).toEqual([]);
  });

  it('全部 ready → blocked/ambiguous 为零', () => {
    const items: CapabilityAvailabilityItem[] = [
      { capabilityId: '1', capabilityName: 'A', slotId: 's1', slotName: 'S1', status: 'ready' },
      { capabilityId: '2', capabilityName: 'B', slotId: 's1', slotName: 'S1', status: 'ready' },
    ];
    const summary = summarizeAvailability(items);
    expect(summary.readyCount).toBe(2);
    expect(summary.blockedCount).toBe(0);
    expect(summary.ambiguousCount).toBe(0);
  });
});
