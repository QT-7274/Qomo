/**
 * LaunchPanelComponent 测试
 *
 * V1 Story: 启动面板 — 列表渲染、搜索过滤、最近使用、空状态、点击选择。
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LaunchPanelComponent } from '../src/components/LaunchPanel/LaunchPanelComponent';
import { StorageService } from '../src/services/StorageService';

beforeEach(async () => {
  await StorageService._db.workUnits.clear();
  await StorageService._db.workUnitVersions.clear();
  await StorageService._db.recentLaunches.clear();
});

afterEach(() => {
  cleanup();
});

function renderPanel() {
  return render(
    <MemoryRouter initialEntries={['/launch']}>
      <LaunchPanelComponent />
    </MemoryRouter>,
  );
}

describe('LaunchPanelComponent', () => {
  it('渲染启动台标题', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText(/启动台/)).toBeTruthy();
    });
  });

  it('无 Work Unit 时显示空状态引导', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('还没有 Work Unit')).toBeTruthy();
      expect(screen.getByText('前往设计台')).toBeTruthy();
    });
  });

  it('展示 Work Unit 列表', async () => {
    await StorageService.createWorkUnit('编码任务启动');
    await StorageService.createWorkUnit('代码审查');

    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('编码任务启动')).toBeTruthy();
      expect(screen.getByText('代码审查')).toBeTruthy();
    });
  });

  it('每个 WU 显示交接状态', async () => {
    await StorageService.createWorkUnit('测试 WU');

    renderPanel();
    await waitFor(() => {
      // 无 Slot 的 WU → incomplete → "❌ 需完善"
      const badges = screen.getAllByText(/需完善/);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('搜索过滤 Work Unit', async () => {
    await StorageService.createWorkUnit('编码任务启动');
    await StorageService.createWorkUnit('代码审查');

    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByText('编码任务启动').length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText('搜索 Work Unit…');
    fireEvent.change(searchInput, { target: { value: '编码' } });

    await waitFor(() => {
      expect(screen.getAllByText('编码任务启动').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('代码审查')).toBeNull();
    });
  });

  it('显示最近使用区域', async () => {
    const wu = await StorageService.createWorkUnit('最近用的');
    await StorageService.recordRecentLaunch(wu.id, wu.name);

    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByText('最近使用').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('最近用的').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('搜索时隐藏最近使用区域', async () => {
    const wu = await StorageService.createWorkUnit('Test WU');
    await StorageService.recordRecentLaunch(wu.id, wu.name);

    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByText('最近使用').length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText('搜索 Work Unit…');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.queryByText('最近使用')).toBeNull();
    });
  });

  it('有快照的 WU 显示快照标签', async () => {
    const wu = await StorageService.createWorkUnit('带快照的');
    await StorageService.createSnapshot(wu.id);

    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('有快照')).toBeTruthy();
    });
  });
});
