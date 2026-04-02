/**
 * contextEnvelopeUtil 测试
 *
 * V2 Story: 待补齐项提取 + 完整性计算纯函数。
 * Review fix: 逐 method 判断替代全局布尔。
 */

import { describe, it, expect } from 'vitest';
import {
  extractFillInItems,
  computeSlotFillStatus,
  computeCompleteness,
  getMissingRequiredItems,
} from '../src/utils/contextEnvelopeUtil';
import type { Slot } from '../src/types/slot.types';
import type { LaunchContextEnvelope } from '../src/types/launch.types';

// ---------------------------------------------------------------------------
// 测试数据
// ---------------------------------------------------------------------------

function makeSlot(overrides: Partial<Slot> & { id: string; name: string }): Slot {
  return {
    slotType: 'context',
    required: false,
    capabilities: [],
    ...overrides,
  };
}

const slotWithAutoFillIn = makeSlot({
  id: 'slot-auto',
  name: '仓库路径',
  required: true,
  fillIn: { method: 'auto', hint: '当前仓库路径' },
});

const slotWithConfirmFillIn = makeSlot({
  id: 'slot-confirm',
  name: '任务目标',
  required: true,
  fillIn: { method: 'user-confirm', hint: '请确认任务目标' },
});

const slotWithManualFillIn = makeSlot({
  id: 'slot-manual',
  name: '特殊说明',
  required: false,
  fillIn: { method: 'manual', hint: '可选补充' },
});

const slotWithoutFillIn = makeSlot({
  id: 'slot-no-fill',
  name: '已定义规则',
  required: true,
});

const mixedSlots: Slot[] = [
  slotWithAutoFillIn,
  slotWithConfirmFillIn,
  slotWithManualFillIn,
  slotWithoutFillIn,
];

function partialEnvelope(overrides: Partial<LaunchContextEnvelope> = {}): Partial<LaunchContextEnvelope> {
  return overrides;
}

// ---------------------------------------------------------------------------
// extractFillInItems
// ---------------------------------------------------------------------------

describe('extractFillInItems', () => {
  it('提取所有带 fillIn 的 Slot', () => {
    const items = extractFillInItems(mixedSlots);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.slotId)).toEqual(['slot-auto', 'slot-confirm', 'slot-manual']);
  });

  it('无 fillIn 的 Slot 不返回', () => {
    const items = extractFillInItems([slotWithoutFillIn]);
    expect(items).toHaveLength(0);
  });

  it('空 Slot 列表返回空数组', () => {
    expect(extractFillInItems([])).toEqual([]);
  });

  it('正确映射 method / hint / required（无 filled 字段）', () => {
    const items = extractFillInItems([slotWithAutoFillIn]);
    expect(items[0]).toMatchObject({
      slotId: 'slot-auto',
      slotName: '仓库路径',
      method: 'auto',
      hint: '当前仓库路径',
      required: true,
    });
    expect(items[0]).not.toHaveProperty('filled');
  });

  it('全部有 fillIn 的 Slot 全部返回', () => {
    const items = extractFillInItems([slotWithAutoFillIn, slotWithConfirmFillIn, slotWithManualFillIn]);
    expect(items).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// computeSlotFillStatus — 按 method 逐 Slot 判断
// ---------------------------------------------------------------------------

describe('computeSlotFillStatus', () => {
  const items = extractFillInItems(mixedSlots);

  it('无输入 → 所有项 empty', () => {
    const status = computeSlotFillStatus(items, partialEnvelope());
    expect(Object.values(status)).toEqual(['empty', 'empty', 'empty']);
  });

  it('只填 workspace → auto 项 filled，其他 empty', () => {
    const status = computeSlotFillStatus(items, partialEnvelope({ workspace: '/repo' }));
    expect(status['slot-auto']).toBe('filled');
    expect(status['slot-confirm']).toBe('empty');
    expect(status['slot-manual']).toBe('empty');
  });

  it('只填 taskGoal → user-confirm 项 filled，其他 empty', () => {
    const status = computeSlotFillStatus(items, partialEnvelope({ taskGoal: '修复 bug' }));
    expect(status['slot-auto']).toBe('empty');
    expect(status['slot-confirm']).toBe('filled');
    expect(status['slot-manual']).toBe('empty');
  });

  it('只填 additionalNotes → manual 项 filled，其他 empty', () => {
    const status = computeSlotFillStatus(items, partialEnvelope({ additionalNotes: '补充' }));
    expect(status['slot-auto']).toBe('empty');
    expect(status['slot-confirm']).toBe('empty');
    expect(status['slot-manual']).toBe('filled');
  });

  it('files 非空 → 所有项 filled', () => {
    const status = computeSlotFillStatus(items, partialEnvelope({ files: ['src/a.ts'] }));
    expect(Object.values(status)).toEqual(['filled', 'filled', 'filled']);
  });

  it('空白字符串不算有输入', () => {
    const status = computeSlotFillStatus(items, partialEnvelope({ taskGoal: '  ' }));
    expect(Object.values(status)).toEqual(['empty', 'empty', 'empty']);
  });

  it('全部填满 → 全部 filled', () => {
    const status = computeSlotFillStatus(items, partialEnvelope({
      workspace: '/repo', taskGoal: '目标', additionalNotes: '补充',
    }));
    expect(Object.values(status)).toEqual(['filled', 'filled', 'filled']);
  });
});

// ---------------------------------------------------------------------------
// computeCompleteness — partial 状态可达
// ---------------------------------------------------------------------------

describe('computeCompleteness', () => {
  const items = extractFillInItems(mixedSlots);

  it('无待补齐项 → complete', () => {
    expect(computeCompleteness([], partialEnvelope())).toBe('complete');
  });

  it('无输入 → empty', () => {
    expect(computeCompleteness(items, partialEnvelope())).toBe('empty');
  });

  it('只填 workspace（auto required 满足，confirm required 不满足）→ partial', () => {
    expect(computeCompleteness(items, partialEnvelope({ workspace: '/repo' }))).toBe('partial');
  });

  it('只填 taskGoal（confirm required 满足，auto required 不满足）→ partial', () => {
    expect(computeCompleteness(items, partialEnvelope({ taskGoal: '目标' }))).toBe('partial');
  });

  it('全部 required 满足 → complete', () => {
    expect(computeCompleteness(items, partialEnvelope({
      workspace: '/repo', taskGoal: '目标',
    }))).toBe('complete');
  });

  it('只有可选项 + 有输入 → complete', () => {
    const optionalOnly = extractFillInItems([slotWithManualFillIn]);
    expect(computeCompleteness(optionalOnly, partialEnvelope({ additionalNotes: '补充' }))).toBe('complete');
  });

  it('空白字符串 → empty', () => {
    expect(computeCompleteness(items, partialEnvelope({ taskGoal: '' }))).toBe('empty');
  });

  it('files 满足所有 method → complete', () => {
    expect(computeCompleteness(items, partialEnvelope({ files: ['src/a.ts'] }))).toBe('complete');
  });
});

// ---------------------------------------------------------------------------
// getMissingRequiredItems — 逐 method 判断
// ---------------------------------------------------------------------------

describe('getMissingRequiredItems', () => {
  const items = extractFillInItems(mixedSlots);

  it('无输入 → 返回所有 required 项', () => {
    const missing = getMissingRequiredItems(items, partialEnvelope());
    expect(missing).toHaveLength(2);
    expect(missing.map((m) => m.slotId)).toEqual(['slot-auto', 'slot-confirm']);
  });

  it('只填 workspace → confirm 项仍缺失', () => {
    const missing = getMissingRequiredItems(items, partialEnvelope({ workspace: '/repo' }));
    expect(missing).toHaveLength(1);
    expect(missing[0].slotId).toBe('slot-confirm');
  });

  it('只填 taskGoal → auto 项仍缺失', () => {
    const missing = getMissingRequiredItems(items, partialEnvelope({ taskGoal: '目标' }));
    expect(missing).toHaveLength(1);
    expect(missing[0].slotId).toBe('slot-auto');
  });

  it('全部 required 满足 → 返回空', () => {
    const missing = getMissingRequiredItems(items, partialEnvelope({
      workspace: '/repo', taskGoal: '目标',
    }));
    expect(missing).toHaveLength(0);
  });

  it('无 required 项 → 返回空', () => {
    const optionalOnly = extractFillInItems([slotWithManualFillIn]);
    expect(getMissingRequiredItems(optionalOnly, partialEnvelope())).toHaveLength(0);
  });

  it('files 满足所有 → 返回空', () => {
    const missing = getMissingRequiredItems(items, partialEnvelope({ files: ['src/a.ts'] }));
    expect(missing).toHaveLength(0);
  });
});
