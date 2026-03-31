/**
 * Constraint 类型契约测试
 *
 * 验证约束类型结构满足 W2b AC 要求。
 */

import { describe, it, expect } from 'vitest';
import type {
  ConstraintType,
  ConstraintPack,
  OutputFormatType,
  LengthLimit,
  ChecklistItem,
} from '../src/types';

describe('Constraint types contract', () => {
  it('ConstraintType 包含三种类型', () => {
    const types: ConstraintType[] = ['output', 'boundary', 'quality'];
    expect(types).toHaveLength(3);
  });

  it('ConstraintPack 基础结构', () => {
    const pack: ConstraintPack = {
      id: 'cp-1',
      name: '输出格式',
      constraintType: 'output',
      content: '使用 Markdown 格式',
      order: 0,
    };
    expect(pack.id).toBe('cp-1');
    expect(pack.constraintType).toBe('output');
    expect(pack.content).toBe('使用 Markdown 格式');
  });

  it('output 约束包支持格式和长度限制', () => {
    const pack: ConstraintPack = {
      id: 'cp-2',
      name: '结构化输出',
      constraintType: 'output',
      content: '输出 JSON 格式，不超过 500 字',
      order: 0,
      outputFormat: 'json',
      lengthLimit: { unit: 'words', max: 500 },
    };
    expect(pack.outputFormat).toBe('json');
    expect(pack.lengthLimit!.unit).toBe('words');
    expect(pack.lengthLimit!.max).toBe(500);
  });

  it('quality 约束包支持检查清单', () => {
    const items: ChecklistItem[] = [
      { id: 'ci-1', text: '检查拼写', required: true, order: 0 },
      { id: 'ci-2', text: '验证引用', required: false, order: 1 },
    ];
    const pack: ConstraintPack = {
      id: 'cp-3',
      name: '质量检查',
      constraintType: 'quality',
      content: '输出前自检',
      order: 0,
      checklistItems: items,
    };
    expect(pack.checklistItems).toHaveLength(2);
    expect(pack.checklistItems![0].required).toBe(true);
  });

  it('boundary 约束包只有 content', () => {
    const pack: ConstraintPack = {
      id: 'cp-4',
      name: '边界规则',
      constraintType: 'boundary',
      content: '不要编造信息，只使用给定上下文',
      order: 0,
    };
    expect(pack.outputFormat).toBeUndefined();
    expect(pack.checklistItems).toBeUndefined();
  });

  it('OutputFormatType 包含六种格式', () => {
    const formats: OutputFormatType[] = ['markdown', 'json', 'table', 'plaintext', 'yaml', 'csv'];
    expect(formats).toHaveLength(6);
  });

  it('LengthLimit 支持三种单位和可选 min/max', () => {
    const limit: LengthLimit = { unit: 'lines', min: 10, max: 50 };
    expect(limit.unit).toBe('lines');
    expect(limit.min).toBe(10);
    expect(limit.max).toBe(50);

    const noMin: LengthLimit = { unit: 'characters', max: 1000 };
    expect(noMin.min).toBeUndefined();
  });
});
