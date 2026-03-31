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
