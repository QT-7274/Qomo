/**
 * Slot & Capability 类型契约测试
 *
 * 验证类型结构满足 W2a AC 要求，且预留 W2b/W2c 扩展空间。
 */

import { describe, it, expect } from 'vitest';
import type { Slot, SlotType, Capability } from '../src/types';

describe('Slot types contract', () => {
  it('SlotType 包含五种基本类型', () => {
    const types: SlotType[] = ['context', 'rule', 'output', 'capability', 'custom'];
    expect(types).toHaveLength(5);
  });

  it('Slot 结构包含所有必需字段', () => {
    const slot: Slot = {
      id: 'slot-1',
      name: '上下文',
      slotType: 'context',
      description: '提供背景信息',
      required: true,
      capabilities: [],
    };

    expect(slot.id).toBe('slot-1');
    expect(slot.name).toBe('上下文');
    expect(slot.slotType).toBe('context');
    expect(slot.description).toBe('提供背景信息');
    expect(slot.required).toBe(true);
    expect(slot.capabilities).toEqual([]);
  });

  it('Slot 的 description 可选', () => {
    const slot: Slot = {
      id: 'slot-2',
      name: '规则',
      slotType: 'rule',
      required: false,
      capabilities: [],
    };
    expect(slot.description).toBeUndefined();
  });

  it('Capability 结构包含所有必需字段', () => {
    const cap: Capability = {
      id: 'cap-1',
      name: '代码审查',
      content: '审查代码质量和安全性',
      order: 0,
    };

    expect(cap.id).toBe('cap-1');
    expect(cap.name).toBe('代码审查');
    expect(cap.content).toBe('审查代码质量和安全性');
    expect(cap.order).toBe(0);
  });

  it('Slot 可包含多个 Capability', () => {
    const slot: Slot = {
      id: 'slot-3',
      name: '能力挂载',
      slotType: 'capability',
      required: true,
      capabilities: [
        { id: 'c1', name: 'A', content: '内容A', order: 0 },
        { id: 'c2', name: 'B', content: '内容B', order: 1 },
      ],
    };
    expect(slot.capabilities).toHaveLength(2);
    expect(slot.capabilities[0].order).toBeLessThan(slot.capabilities[1].order);
  });
});
