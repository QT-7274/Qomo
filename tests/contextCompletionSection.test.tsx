/**
 * ContextCompletionSection 组件测试
 *
 * V2 Story: 现场补齐上下文。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ContextCompletionSection } from '../src/components/LaunchSession/ContextCompletionSection';
import type { UseLaunchContextReturn } from '../src/hooks/useLaunchContext';
import type { FillInItem, ContextCompleteness } from '../src/types/launch.types';

// ---------------------------------------------------------------------------
// 测试数据
// ---------------------------------------------------------------------------

function createMockCtx(overrides: Partial<UseLaunchContextReturn> = {}): UseLaunchContextReturn {
  return {
    fillInItems: [],
    completeness: 'empty' as ContextCompleteness,
    missingRequired: [],
    slotFillStatus: {},
    taskGoal: '',
    workspace: '',
    files: [],
    additionalNotes: '',
    setTaskGoal: vi.fn(),
    setWorkspace: vi.fn(),
    addFile: vi.fn(),
    removeFile: vi.fn(),
    setAdditionalNotes: vi.fn(),
    buildEnvelope: vi.fn() as unknown as UseLaunchContextReturn['buildEnvelope'],
    ...overrides,
  };
}

const autoItem: FillInItem = {
  slotId: 's1', slotName: '仓库路径', method: 'auto', hint: '当前仓库', required: true,
};
const confirmItem: FillInItem = {
  slotId: 's2', slotName: '任务目标', method: 'user-confirm', hint: '确认目标', required: true,
};
const manualItem: FillInItem = {
  slotId: 's3', slotName: '额外说明', method: 'manual', hint: '可选补充', required: false,
};

// ---------------------------------------------------------------------------
// 测试
// ---------------------------------------------------------------------------

describe('ContextCompletionSection', () => {

  beforeEach(() => {
    cleanup();
  });

  describe('待补齐项清单渲染', () => {
    it('按三种 method 分组展示', () => {
      const ctx = createMockCtx({
        fillInItems: [autoItem, confirmItem, manualItem],
      });
      render(<ContextCompletionSection ctx={ctx} />);

      // fillIn 项名称（在 fillin-list 内）
      const fillInList = screen.getByTestId('fillin-list');
      expect(fillInList.textContent).toContain('仓库路径');
      expect(fillInList.textContent).toContain('任务目标');
      expect(fillInList.textContent).toContain('额外说明');
      // method 标签
      expect(screen.getByText('🟢 自动带入')).toBeTruthy();
      expect(screen.getByText('🟡 需确认')).toBeTruthy();
      expect(screen.getByText('🔴 手动补齐')).toBeTruthy();
    });

    it('无待补齐项时不渲染清单区域', () => {
      const ctx = createMockCtx({ fillInItems: [] });
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.queryByTestId('fillin-list')).toBeNull();
    });
  });

  describe('任务目标输入', () => {
    it('输入触发 setTaskGoal', () => {
      const setTaskGoal = vi.fn();
      const ctx = createMockCtx({ setTaskGoal });
      render(<ContextCompletionSection ctx={ctx} />);

      const textarea = screen.getByPlaceholderText('描述本次任务的具体目标…');
      fireEvent.change(textarea, { target: { value: '修复登录 bug' } });
      expect(setTaskGoal).toHaveBeenCalledWith('修复登录 bug');
    });
  });

  describe('文件列表添加/删除', () => {
    it('添加文件 → 调用 addFile', () => {
      const addFile = vi.fn();
      const ctx = createMockCtx({ addFile });
      render(<ContextCompletionSection ctx={ctx} />);

      const input = screen.getByTestId('file-input');
      fireEvent.change(input, { target: { value: 'src/a.ts' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(addFile).toHaveBeenCalledWith('src/a.ts');
    });

    it('删除文件 → 调用 removeFile', () => {
      const removeFile = vi.fn();
      const ctx = createMockCtx({
        files: ['src/a.ts', 'src/b.ts'],
        removeFile,
      });
      render(<ContextCompletionSection ctx={ctx} />);

      const removeBtns = screen.getAllByRole('button', { name: /删除/ });
      fireEvent.click(removeBtns[0]);
      expect(removeFile).toHaveBeenCalledWith('src/a.ts');
    });

    it('文件列表正确渲染', () => {
      const ctx = createMockCtx({ files: ['src/a.ts', 'src/b.ts'] });
      render(<ContextCompletionSection ctx={ctx} />);

      const fileList = screen.getByTestId('file-list');
      expect(fileList.children).toHaveLength(2);
    });
  });

  describe('缺失清单展示', () => {
    it('有缺失项时展示缺失清单', () => {
      const ctx = createMockCtx({
        missingRequired: [autoItem, confirmItem],
      });
      render(<ContextCompletionSection ctx={ctx} />);

      const list = screen.getByTestId('missing-list');
      expect(list).toBeTruthy();
      expect(list.textContent).toContain('仓库路径');
      expect(list.textContent).toContain('任务目标');
    });

    it('无缺失项时不展示缺失清单', () => {
      const ctx = createMockCtx({ missingRequired: [] });
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.queryByTestId('missing-list')).toBeNull();
    });
  });

  describe('完整性状态', () => {
    it('empty 状态显示正确文案', () => {
      const ctx = createMockCtx({ completeness: 'empty' });
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.getByText('📋 尚未填写任何上下文')).toBeTruthy();
    });

    it('partial 状态显示正确文案', () => {
      const ctx = createMockCtx({ completeness: 'partial' });
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.getByText('⚠️ 部分必需项待补齐')).toBeTruthy();
    });

    it('complete 状态显示正确文案', () => {
      const ctx = createMockCtx({ completeness: 'complete' });
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.getByText('✅ 上下文已就绪')).toBeTruthy();
    });
  });

  describe('V2 占位替换', () => {
    it('不再显示 V1 占位文案', () => {
      const ctx = createMockCtx();
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.queryByText(/后续 V2/)).toBeNull();
    });

    it('显示上下文补齐标题', () => {
      const ctx = createMockCtx();
      render(<ContextCompletionSection ctx={ctx} />);
      expect(screen.getByRole('heading', { name: '现场补齐上下文' })).toBeTruthy();
    });
  });
});
