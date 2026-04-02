/**
 * CapabilityOverviewSection 组件测试
 *
 * V3a Story: 能力可用性总览。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CapabilityOverviewSection } from '../src/components/LaunchSession/CapabilityOverviewSection';
import type { UseCapabilityAvailabilityReturn } from '../src/hooks/useCapabilityAvailability';
import type { CapabilityAvailabilityItem } from '../src/types/capabilityAvailability.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<CapabilityAvailabilityItem> & { capabilityId: string }): CapabilityAvailabilityItem {
  return {
    capabilityName: 'Cap',
    slotId: 's1',
    slotName: 'Slot',
    status: 'ready',
    ...overrides,
  };
}

function createMockAvailability(
  items: CapabilityAvailabilityItem[],
  overrides: Partial<UseCapabilityAvailabilityReturn> = {},
): UseCapabilityAvailabilityReturn {
  const readyCount = items.filter((i) => i.status === 'ready').length;
  const blockedCount = items.filter((i) =>
    i.status === 'missing' || i.status === 'version_incompatible' || i.status === 'permission_denied',
  ).length;
  const ambiguousCount = items.filter((i) => i.status === 'ambiguous_candidate').length;

  return {
    items,
    summary: { readyCount, blockedCount, ambiguousCount, items },
    allReady: items.length > 0 && blockedCount === 0 && ambiguousCount === 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 测试
// ---------------------------------------------------------------------------

describe('CapabilityOverviewSection', () => {
  beforeEach(() => { cleanup(); });

  describe('三分组渲染', () => {
    it('阻塞 + 待决 + 已就绪 分组都展示', () => {
      const items: CapabilityAvailabilityItem[] = [
        makeItem({ capabilityId: '1', capabilityName: '规则A', status: 'ready' }),
        makeItem({ capabilityId: '2', capabilityName: '工具B', status: 'missing', issueType: 'missing' }),
        makeItem({ capabilityId: '3', capabilityName: '候选C', status: 'ambiguous_candidate', issueType: 'ambiguous_candidate' }),
      ];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.getByTestId('blocked-group')).toBeTruthy();
      expect(screen.getByTestId('ambiguous-group')).toBeTruthy();
      expect(screen.getByTestId('ready-group')).toBeTruthy();
    });

    it('无阻塞时不渲染阻塞分组', () => {
      const items = [makeItem({ capabilityId: '1', status: 'ready' })];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.queryByTestId('blocked-group')).toBeNull();
    });
  });

  describe('全部就绪正向确认', () => {
    it('全部 ready → 显示确认横幅', () => {
      const items = [
        makeItem({ capabilityId: '1', status: 'ready' }),
        makeItem({ capabilityId: '2', status: 'ready' }),
      ];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.getByTestId('all-ready-banner')).toBeTruthy();
      expect(screen.getByText('✅ 所有能力均已就绪')).toBeTruthy();
    });

    it('有阻塞 → 不显示确认横幅', () => {
      const items = [
        makeItem({ capabilityId: '1', status: 'ready' }),
        makeItem({ capabilityId: '2', status: 'missing', issueType: 'missing' }),
      ];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.queryByTestId('all-ready-banner')).toBeNull();
    });
  });

  describe('无 Capability 空态', () => {
    it('无 item → 显示空态提示', () => {
      const av = createMockAvailability([]);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.getByTestId('no-capability-hint')).toBeTruthy();
      expect(screen.getByText('当前无声明能力')).toBeTruthy();
    });

    it('无 item → 不显示统计摘要', () => {
      const av = createMockAvailability([]);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.queryByTestId('availability-summary')).toBeNull();
    });
  });

  describe('统计摘要数量', () => {
    it('正确显示各分组数量', () => {
      const items = [
        makeItem({ capabilityId: '1', status: 'ready' }),
        makeItem({ capabilityId: '2', status: 'ready' }),
        makeItem({ capabilityId: '3', status: 'missing', issueType: 'missing' }),
        makeItem({ capabilityId: '4', status: 'ambiguous_candidate', issueType: 'ambiguous_candidate' }),
      ];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      const summary = screen.getByTestId('availability-summary');
      expect(summary.textContent).toContain('已就绪 2');
      expect(summary.textContent).toContain('阻塞 1');
      expect(summary.textContent).toContain('待决 1');
    });
  });

  describe('已就绪分组折叠/展开', () => {
    it('默认折叠，点击可展开', () => {
      const items = [
        makeItem({ capabilityId: '1', capabilityName: '规则A', status: 'ready' }),
        makeItem({ capabilityId: '2', capabilityName: '工具B', status: 'missing', issueType: 'missing' }),
      ];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      // 默认折叠：规则A 不可见
      expect(screen.queryByText('规则A')).toBeNull();

      // 点击展开（target the h3 heading inside ready-group）
      const readyGroup = screen.getByTestId('ready-group');
      const readyHeader = readyGroup.querySelector('h3')!;
      fireEvent.click(readyHeader);

      expect(screen.getByText('规则A')).toBeTruthy();
    });
  });

  describe('能力条目信息', () => {
    it('显示名称 + Slot + 状态', () => {
      const items = [
        makeItem({
          capabilityId: '1',
          capabilityName: '代码审查规则',
          slotName: '规则 Slot',
          status: 'missing',
          issueType: 'missing',
          description: '能力内容为空',
        }),
      ];
      const av = createMockAvailability(items);
      render(<CapabilityOverviewSection availability={av} />);

      expect(screen.getByText('代码审查规则')).toBeTruthy();
      expect(screen.getByText('规则 Slot')).toBeTruthy();
      expect(screen.getByText('缺失')).toBeTruthy();
      expect(screen.getByText('能力内容为空')).toBeTruthy();
    });
  });
});
