/**
 * WorkUnitListComponent 渲染测试
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkUnitListComponent } from '../src/components/WorkUnitList/WorkUnitListComponent';
import { StorageService } from '../src/services/StorageService';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <WorkUnitListComponent />
    </MemoryRouter>,
  );
}

describe('WorkUnitListComponent', () => {
  beforeEach(async () => {
    cleanup();
    await StorageService._db.workUnits.clear();
  });

  it('空状态时展示引导文案', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('还没有 Work Unit')).toBeTruthy();
    });
    expect(screen.getByText('创建第一个 Work Unit')).toBeTruthy();
  });

  it('展示已有的 Work Unit 列表', async () => {
    await StorageService.createWorkUnit('我的 Prompt');
    await StorageService.createWorkUnit('代码审查助手');

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('我的 Prompt')).toBeTruthy();
    });
    expect(screen.getByText('代码审查助手')).toBeTruthy();
  });

  it('搜索过滤列表', async () => {
    await StorageService.createWorkUnit('代码审查');
    await StorageService.createWorkUnit('需求分析');

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('代码审查')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('搜索 Work Unit…');
    fireEvent.change(searchInput, { target: { value: '代码' } });

    await waitFor(() => {
      expect(screen.getByText('代码审查')).toBeTruthy();
      expect(screen.queryByText('需求分析')).toBeNull();
    });
  });

  it('搜索无结果时提示', async () => {
    await StorageService.createWorkUnit('代码审查');

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('代码审查')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('搜索 Work Unit…');
    fireEvent.change(searchInput, { target: { value: '不存在的' } });

    await waitFor(() => {
      expect(screen.getByText(/没有找到匹配/)).toBeTruthy();
    });
  });

  it('删除 Work Unit 需确认', async () => {
    await StorageService.createWorkUnit('待删除');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('待删除')).toBeTruthy();
    });

    const deleteBtn = screen.getByLabelText('删除 待删除');
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('确定要删除「待删除」吗？此操作不可撤销。');

    await waitFor(() => {
      expect(screen.queryByText('待删除')).toBeNull();
    });

    confirmSpy.mockRestore();
  });

  it('取消删除不影响列表', async () => {
    await StorageService.createWorkUnit('保留的');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('保留的')).toBeTruthy();
    });

    const deleteBtn = screen.getByLabelText('删除 保留的');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('保留的')).toBeTruthy();
    confirmSpy.mockRestore();
  });

  it('展示来源类型标签', async () => {
    await StorageService.createWorkUnit('全新的', 'created_new');
    await StorageService.createWorkUnit('克隆的', 'cloned_from');

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('全新的')).toBeTruthy();
    });

    const tags = screen.getAllByText('全新');
    expect(tags.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('克隆')).toBeTruthy();
  });

  it('排序切换可用', async () => {
    await StorageService.createWorkUnit('测试项');

    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('测试项')).toBeTruthy();
    });

    const select = screen.getByLabelText('排序方式');
    fireEvent.change(select, { target: { value: 'createdAt' } });
    expect((select as HTMLSelectElement).value).toBe('createdAt');
  });
});
