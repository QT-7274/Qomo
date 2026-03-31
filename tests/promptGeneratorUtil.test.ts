/**
 * promptGeneratorUtil 测试
 *
 * W3: Prompt 预览生成 + 交接准备状态计算。
 */

import { describe, it, expect } from 'vitest';
import { generatePromptPreview, getHandoffReadiness } from '../src/utils/promptGeneratorUtil';
import type { WorkUnitRecord } from '../src/services/StorageService';

function makeWU(overrides: Partial<WorkUnitRecord> = {}): WorkUnitRecord {
  return {
    id: 'wu-1',
    name: '测试单元',
    description: '描述',
    sourceType: 'created_new',
    slots: [],
    constraints: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('generatePromptPreview', () => {
  it('空 Slot + 空约束返回空字符串', () => {
    const wu = makeWU();
    expect(generatePromptPreview(wu)).toBe('');
  });

  it('有 Slot/Capability 时生成按 Slot 分段的文本', () => {
    const wu = makeWU({
      slots: [
        {
          id: 's1', name: '任务目标', slotType: 'context', required: true,
          capabilities: [
            { id: 'c1', name: '目标描述', content: '完成用户认证模块', order: 0 },
          ],
        },
        {
          id: 's2', name: '编码规范', slotType: 'rule', required: false,
          capabilities: [
            { id: 'c2', name: '规范A', content: '使用 TypeScript strict', order: 0 },
            { id: 'c3', name: '规范B', content: '遵循 ESLint 规则', order: 1 },
          ],
        },
      ],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('## 任务目标（上下文）');
    expect(text).toContain('完成用户认证模块');
    expect(text).toContain('## 编码规范（规则）');
    expect(text).toContain('使用 TypeScript strict');
    expect(text).toContain('遵循 ESLint 规则');
    expect(text.indexOf('任务目标')).toBeLessThan(text.indexOf('编码规范'));
  });

  it('Capability 按 order 排列', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: false,
        capabilities: [
          { id: 'c2', name: 'B', content: '第二', order: 1 },
          { id: 'c1', name: 'A', content: '第一', order: 0 },
        ],
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text.indexOf('第一')).toBeLessThan(text.indexOf('第二'));
  });

  it('待补齐 Slot 输出占位符', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: '仓库路径', slotType: 'context', required: true,
        capabilities: [],
        fillIn: { method: 'auto', hint: '从 workspace 提取' },
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('[待补齐: 仓库路径]');
  });

  it('约束包附在末尾', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: false,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
      }],
      constraints: [
        { id: 'cp1', name: '边界', constraintType: 'boundary', content: '不要编造', order: 0 },
      ],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('---');
    expect(text).toContain('### 边界（边界规则）');
    expect(text).toContain('不要编造');
    expect(text.indexOf('内容')).toBeLessThan(text.indexOf('不要编造'));
  });

  it('output 约束包附加格式和长度', () => {
    const wu = makeWU({
      constraints: [{
        id: 'cp1', name: '输出要求', constraintType: 'output', content: '结构化输出',
        order: 0, outputFormat: 'json', lengthLimit: { unit: 'words', max: 500 },
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('格式要求: JSON');
    expect(text).toContain('长度限制: ≤500 词');
  });

  it('quality 约束包附加检查清单', () => {
    const wu = makeWU({
      constraints: [{
        id: 'cp1', name: '质量', constraintType: 'quality', content: '自检',
        order: 0, checklistItems: [
          { id: 'ci1', text: '拼写检查', required: true, order: 0 },
          { id: 'ci2', text: '引用验证', required: false, order: 1 },
        ],
      }],
    });
    const text = generatePromptPreview(wu);
    expect(text).toContain('- [必需] 拼写检查');
    expect(text).toContain('- 引用验证');
  });
});

describe('getHandoffReadiness', () => {
  it('无 Slot 时返回 incomplete', () => {
    expect(getHandoffReadiness(makeWU())).toBe('incomplete');
  });

  it('所有 required Slot 有 Capability 且无 fillIn 时返回 ready', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: true,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('ready');
  });

  it('required Slot 无 Capability 时返回 incomplete', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: true,
        capabilities: [],
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('incomplete');
  });

  it('required Slot 有 fillIn 时返回 incomplete', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: true,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
        fillIn: { method: 'user-confirm' },
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('incomplete');
  });

  it('非 required Slot 有 fillIn 时返回 partial', () => {
    const wu = makeWU({
      slots: [
        {
          id: 's1', name: 'S1', slotType: 'context', required: true,
          capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
        },
        {
          id: 's2', name: 'S2', slotType: 'custom', required: false,
          capabilities: [],
          fillIn: { method: 'manual' },
        },
      ],
    });
    expect(getHandoffReadiness(wu)).toBe('partial');
  });

  it('只有非 required Slot 时，有 Capability 返回 ready', () => {
    const wu = makeWU({
      slots: [{
        id: 's1', name: 'S', slotType: 'context', required: false,
        capabilities: [{ id: 'c1', name: 'C', content: '内容', order: 0 }],
      }],
    });
    expect(getHandoffReadiness(wu)).toBe('ready');
  });
});
