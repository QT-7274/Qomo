/**
 * LaunchSessionComponent 测试
 *
 * V1 Story: 启动会话 — 结构摘要渲染、快照优先加载。
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LaunchSessionComponent } from '../src/components/LaunchSession/LaunchSessionComponent';
import { StorageService } from '../src/services/StorageService';

beforeEach(async () => {
  await StorageService._db.workUnits.clear();
  await StorageService._db.workUnitVersions.clear();
  await StorageService._db.recentLaunches.clear();
});

afterEach(() => {
  cleanup();
});

function renderSession(workUnitId: string) {
  return render(
    <MemoryRouter initialEntries={[`/launch/${workUnitId}`]}>
      <Routes>
        <Route path="/launch/:id" element={<LaunchSessionComponent />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LaunchSessionComponent', () => {
  it('渲染 Work Unit 名称和描述', async () => {
    const wu = await StorageService.createWorkUnit('编码启动');
    await StorageService.updateWorkUnitInfo(wu.id, { description: '一个编码任务' });

    renderSession(wu.id);
    await waitFor(() => {
      expect(screen.getByText('编码启动')).toBeTruthy();
      expect(screen.getByText('一个编码任务')).toBeTruthy();
    });
  });

  it('显示 Slot 结构摘要', async () => {
    const wu = await StorageService.createWorkUnit('结构测试');
    await StorageService.addSlot(wu.id, {
      name: '上下文输入',
      slotType: 'context',
      required: true,
    });
    await StorageService.addSlot(wu.id, {
      name: '输出格式',
      slotType: 'output',
      required: false,
    });

    renderSession(wu.id);
    await waitFor(() => {
      expect(screen.getByText('上下文输入')).toBeTruthy();
      expect(screen.getByText('输出格式')).toBeTruthy();
      expect(screen.getByText('必需')).toBeTruthy();
    });
  });

  it('显示约束包数量', async () => {
    const wu = await StorageService.createWorkUnit('约束测试');
    await StorageService.addConstraint(wu.id, {
      name: '输出约束',
      constraintType: 'output',
      content: '必须使用 JSON',
    });

    renderSession(wu.id);
    await waitFor(() => {
      expect(screen.getByText('约束包：1 个')).toBeTruthy();
    });
  });

  it('无快照时显示当前编辑版本标签', async () => {
    const wu = await StorageService.createWorkUnit('无快照');

    renderSession(wu.id);
    await waitFor(() => {
      expect(screen.getAllByText(/当前编辑版本/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('有快照时优先使用快照内容', async () => {
    const wu = await StorageService.createWorkUnit('原始名称');
    await StorageService.createSnapshot(wu.id);

    // 快照创建后修改名称
    await StorageService.updateWorkUnitInfo(wu.id, { name: '修改后名称' });

    renderSession(wu.id);
    await waitFor(() => {
      // 应该显示快照中的名称，不是修改后的
      expect(screen.getByText('原始名称')).toBeTruthy();
      expect(screen.getByText(/使用快照/)).toBeTruthy();
    });
  });

  it('不存在的 Work Unit 显示错误', async () => {
    renderSession('nonexistent-id');
    await waitFor(() => {
      expect(screen.getByText(/不存在/)).toBeTruthy();
    });
  });

  it('显示 V2 占位提示', async () => {
    const wu = await StorageService.createWorkUnit('V2 占位测试');

    renderSession(wu.id);
    await waitFor(() => {
      expect(screen.getAllByText(/后续 V2/).length).toBeGreaterThanOrEqual(1);
    });
  });
});
