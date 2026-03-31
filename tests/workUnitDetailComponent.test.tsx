/**
 * WorkUnitDetailComponent 编辑器测试
 *
 * W2a: 结构化编辑器的渲染和交互验证。
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WorkUnitDetailComponent } from '../src/components/WorkUnitDetail/WorkUnitDetailComponent';
import { StorageService } from '../src/services/StorageService';

function renderDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/work-unit/${id}`]}>
      <Routes>
        <Route path="/work-unit/:id" element={<WorkUnitDetailComponent />} />
        <Route path="/" element={<div>列表页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WorkUnitDetailComponent', () => {
  beforeEach(async () => {
    cleanup();
    await StorageService._db.workUnits.clear();
  });

  it('展示 Work Unit 基本信息', async () => {
    const wu = await StorageService.createWorkUnit('测试编辑器');
    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByDisplayValue('测试编辑器')).toBeTruthy();
    });
  });

  it('不存在的 ID 展示错误提示', async () => {
    renderDetail('nonexistent');

    await waitFor(() => {
      expect(screen.getByText('Work Unit 不存在。')).toBeTruthy();
    });
  });

  it('编辑名称后持久化', async () => {
    const wu = await StorageService.createWorkUnit('原始名');
    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByDisplayValue('原始名')).toBeTruthy();
    });

    const nameInput = screen.getByDisplayValue('原始名');
    fireEvent.change(nameInput, { target: { value: '新名称' } });
    fireEvent.blur(nameInput);

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.name).toBe('新名称');
    });
  });

  it('编辑描述后持久化', async () => {
    const wu = await StorageService.createWorkUnit('描述测试');
    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('添加描述…')).toBeTruthy();
    });

    const descInput = screen.getByPlaceholderText('添加描述…');
    fireEvent.change(descInput, { target: { value: '新描述' } });
    fireEvent.blur(descInput);

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.description).toBe('新描述');
    });
  });

  it('添加 Slot', async () => {
    const wu = await StorageService.createWorkUnit('Slot测试');
    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('+ 添加 Slot')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('+ 添加 Slot'));

    // 填写 Slot 表单
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Slot 名称')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('Slot 名称'), {
      target: { value: '上下文' },
    });
    fireEvent.click(screen.getByText('确认添加'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots).toHaveLength(1);
      expect(updated!.slots[0].name).toBe('上下文');
    });
  });

  it('删除空 Slot', async () => {
    const wu = await StorageService.createWorkUnit('删Slot');
    await StorageService.addSlot(wu.id, {
      name: '待删',
      slotType: 'context',
      required: false,
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('待删')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('删除 Slot 待删'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots).toHaveLength(0);
    });

    confirmSpy.mockRestore();
  });

  it('添加 Capability 到 Slot', async () => {
    const wu = await StorageService.createWorkUnit('Cap测试');
    await StorageService.addSlot(wu.id, {
      name: '能力挂载',
      slotType: 'capability',
      required: true,
    });

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('能力挂载')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('+ 添加 Capability'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Capability 名称')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('Capability 名称'), {
      target: { value: '代码审查' },
    });
    fireEvent.change(screen.getByPlaceholderText('内容'), {
      target: { value: '审查代码质量' },
    });
    fireEvent.click(screen.getByText('确认添加 Capability'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots[0].capabilities).toHaveLength(1);
      expect(updated!.slots[0].capabilities[0].name).toBe('代码审查');
    });
  });

  it('删除 Capability', async () => {
    const wu = await StorageService.createWorkUnit('删Cap');
    await StorageService.addSlot(wu.id, {
      name: 'S1',
      slotType: 'context',
      required: false,
    });
    const wuData = await StorageService.getWorkUnit(wu.id);
    await StorageService.addCapability(wu.id, wuData!.slots[0].id, {
      name: '待删能力',
      content: '内容',
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('待删能力')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('删除 Capability 待删能力'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots[0].capabilities).toHaveLength(0);
    });

    confirmSpy.mockRestore();
  });

  it('Capability 上移/下移', async () => {
    const wu = await StorageService.createWorkUnit('排序');
    await StorageService.addSlot(wu.id, {
      name: 'S1',
      slotType: 'context',
      required: false,
    });
    const wuData = await StorageService.getWorkUnit(wu.id);
    const slotId = wuData!.slots[0].id;
    await StorageService.addCapability(wu.id, slotId, { name: 'A', content: '内容A' });
    await StorageService.addCapability(wu.id, slotId, { name: 'B', content: '内容B' });

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('B')).toBeTruthy();
    });

    // 将 B 上移（即点击 B 行的上移按钮）
    fireEvent.click(screen.getByLabelText('上移 B'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots[0].capabilities[0].name).toBe('B');
      expect(updated!.slots[0].capabilities[1].name).toBe('A');
    });
  });

  it('添加约束包', async () => {
    const wu = await StorageService.createWorkUnit('约束测试');
    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('+ 添加约束')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('+ 添加约束'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('约束名称')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('约束名称'), { target: { value: '输出规则' } });
    fireEvent.change(screen.getByPlaceholderText('约束内容'), { target: { value: '使用 Markdown' } });
    fireEvent.click(screen.getByText('确认添加约束'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints).toHaveLength(1);
      expect(updated!.constraints[0].name).toBe('输出规则');
    });
  });

  it('删除约束包', async () => {
    const wu = await StorageService.createWorkUnit('删约束');
    await StorageService.addConstraint(wu.id, {
      name: '待删约束',
      constraintType: 'boundary',
      content: '内容',
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('待删约束')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('删除约束 待删约束'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints).toHaveLength(0);
    });

    confirmSpy.mockRestore();
  });

  it('约束列表按类型显示标签', async () => {
    const wu = await StorageService.createWorkUnit('约束标签');
    await StorageService.addConstraint(wu.id, { name: '格式', constraintType: 'output', content: 'md' });
    await StorageService.addConstraint(wu.id, { name: '边界', constraintType: 'boundary', content: 'no' });
    await StorageService.addConstraint(wu.id, { name: '质量', constraintType: 'quality', content: 'check' });

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('格式')).toBeTruthy();
      expect(screen.getByText('边界')).toBeTruthy();
      expect(screen.getByText('质量')).toBeTruthy();
    });

    expect(screen.getByText('输出')).toBeTruthy();
    expect(screen.getByText('边界规则')).toBeTruthy();
    expect(screen.getByText('质量检查')).toBeTruthy();
  });

  it('约束包上移/下移', async () => {
    const wu = await StorageService.createWorkUnit('约束排序');
    await StorageService.addConstraint(wu.id, { name: 'A', constraintType: 'output', content: 'a' });
    await StorageService.addConstraint(wu.id, { name: 'B', constraintType: 'boundary', content: 'b' });

    renderDetail(wu.id);

    await waitFor(() => {
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('B')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('上移约束 B'));

    await waitFor(async () => {
      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints[0].name).toBe('B');
      expect(updated!.constraints[1].name).toBe('A');
    });
  });

  describe('待补齐声明 UI', () => {
    it('Slot 无 fillIn 时不显示待补齐标签', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '普通Slot', slotType: 'context', required: false });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('普通Slot')).toBeTruthy();
      });
      expect(screen.queryByText('待补齐')).toBeNull();
    });

    it('Slot 有 fillIn 时显示待补齐标签和方式', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标Slot', slotType: 'context', required: true });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.setSlotFillIn(wu.id, after!.slots[0].id, { method: 'user-confirm', hint: '请输入目标' });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('目标Slot')).toBeTruthy();
      });
      expect(screen.getByText('待补齐')).toBeTruthy();
      expect(screen.getByText('user-confirm')).toBeTruthy();
    });

    it('待补齐摘要区域显示正确统计', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: 'Slot1', slotType: 'context', required: true });
      await StorageService.addSlot(wu.id, { name: 'Slot2', slotType: 'rule', required: false });
      await StorageService.addSlot(wu.id, { name: 'Slot3', slotType: 'output', required: false });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.setSlotFillIn(wu.id, after!.slots[0].id, { method: 'auto' });
      await StorageService.setSlotFillIn(wu.id, after!.slots[1].id, { method: 'user-confirm' });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText(/待补齐项/)).toBeTruthy();
      });
      expect(screen.getByText(/待补齐项 \(2\)/)).toBeTruthy();
    });

    it('无待补齐项时不显示摘要区域', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: 'Slot1', slotType: 'context', required: false });
      renderDetail(wu.id);

      await waitFor(() => {
        expect(screen.getByText('Slot1')).toBeTruthy();
      });
      expect(screen.queryByText(/待补齐项/)).toBeNull();
    });
  });
});
