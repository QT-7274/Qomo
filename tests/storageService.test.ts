/**
 * StorageService 测试
 *
 * 使用 fake-indexeddb 模拟 IndexedDB 环境。
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/services/StorageService';

describe('StorageService', () => {
  beforeEach(async () => {
    // 清空数据库
    await StorageService._db.workUnits.clear();
  });

  describe('createWorkUnit', () => {
    it('创建全新 Work Unit 并返回完整记录', async () => {
      const record = await StorageService.createWorkUnit('测试单元');

      expect(record.id).toBeTruthy();
      expect(record.name).toBe('测试单元');
      expect(record.sourceType).toBe('created_new');
      expect(record.createdAt).toBeTruthy();
      expect(record.updatedAt).toBeTruthy();
    });

    it('支持指定 sourceType', async () => {
      const record = await StorageService.createWorkUnit('克隆单元', 'cloned_from');
      expect(record.sourceType).toBe('cloned_from');
    });

    it('每次创建生成不同 ID', async () => {
      const r1 = await StorageService.createWorkUnit('A');
      const r2 = await StorageService.createWorkUnit('B');
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('listWorkUnits', () => {
    it('返回空数组当无数据时', async () => {
      const list = await StorageService.listWorkUnits();
      expect(list).toEqual([]);
    });

    it('返回所有已创建的 Work Unit', async () => {
      await StorageService.createWorkUnit('A');
      await StorageService.createWorkUnit('B');
      const list = await StorageService.listWorkUnits();
      expect(list).toHaveLength(2);
    });

    it('按 updatedAt 降序排列（默认）', async () => {
      await StorageService.createWorkUnit('早的');
      // 确保时间差异
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.createWorkUnit('晚的');

      const list = await StorageService.listWorkUnits({ sortBy: 'updatedAt', sortDirection: 'desc' });
      expect(list[0].name).toBe('晚的');
      expect(list[1].name).toBe('早的');
    });

    it('支持按 createdAt 升序排列', async () => {
      await StorageService.createWorkUnit('早的');
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.createWorkUnit('晚的');

      const list = await StorageService.listWorkUnits({ sortBy: 'createdAt', sortDirection: 'asc' });
      expect(list[0].name).toBe('早的');
      expect(list[1].name).toBe('晚的');
    });
  });

  describe('getWorkUnit', () => {
    it('按 ID 获取存在的 Work Unit', async () => {
      const created = await StorageService.createWorkUnit('目标');
      const found = await StorageService.getWorkUnit(created.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('目标');
    });

    it('获取不存在的 ID 返回 undefined', async () => {
      const found = await StorageService.getWorkUnit('nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('deleteWorkUnit', () => {
    it('删除后列表中不再包含该项', async () => {
      const record = await StorageService.createWorkUnit('待删除');
      await StorageService.deleteWorkUnit(record.id);
      const list = await StorageService.listWorkUnits();
      expect(list).toHaveLength(0);
    });

    it('删除不存在的 ID 不报错', async () => {
      await expect(StorageService.deleteWorkUnit('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('updateWorkUnit', () => {
    it('更新名称并刷新 updatedAt', async () => {
      const record = await StorageService.createWorkUnit('原始名');
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.updateWorkUnit(record.id, { name: '新名称' });

      const updated = await StorageService.getWorkUnit(record.id);
      expect(updated!.name).toBe('新名称');
      expect(updated!.updatedAt).not.toBe(record.updatedAt);
    });
  });

  describe('schema v2 — description and slots', () => {
    it('创建 Work Unit 后 description 默认为空字符串', async () => {
      const record = await StorageService.createWorkUnit('带描述');
      expect(record.description).toBe('');
    });

    it('创建 Work Unit 后 slots 默认为空数组', async () => {
      const record = await StorageService.createWorkUnit('带槽位');
      expect(record.slots).toEqual([]);
    });
  });

  describe('updateWorkUnitInfo', () => {
    it('更新名称和描述', async () => {
      const record = await StorageService.createWorkUnit('原始名');
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.updateWorkUnitInfo(record.id, {
        name: '新名称',
        description: '新描述',
      });

      const updated = await StorageService.getWorkUnit(record.id);
      expect(updated!.name).toBe('新名称');
      expect(updated!.description).toBe('新描述');
      expect(updated!.updatedAt).not.toBe(record.updatedAt);
    });

    it('只更新描述，名称不变', async () => {
      const record = await StorageService.createWorkUnit('保持名称');
      await StorageService.updateWorkUnitInfo(record.id, {
        description: '只改描述',
      });

      const updated = await StorageService.getWorkUnit(record.id);
      expect(updated!.name).toBe('保持名称');
      expect(updated!.description).toBe('只改描述');
    });
  });

  describe('Slot CRUD', () => {
    it('addSlot 添加 Slot 到 Work Unit', async () => {
      const wu = await StorageService.createWorkUnit('带Slot');
      await StorageService.addSlot(wu.id, {
        name: '上下文',
        slotType: 'context',
        description: '背景信息',
        required: true,
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots).toHaveLength(1);
      expect(updated!.slots[0].name).toBe('上下文');
      expect(updated!.slots[0].slotType).toBe('context');
      expect(updated!.slots[0].description).toBe('背景信息');
      expect(updated!.slots[0].required).toBe(true);
      expect(updated!.slots[0].capabilities).toEqual([]);
      expect(updated!.slots[0].id).toBeTruthy();
    });

    it('addSlot 不指定 description 时为 undefined', async () => {
      const wu = await StorageService.createWorkUnit('无描述Slot');
      await StorageService.addSlot(wu.id, {
        name: '规则',
        slotType: 'rule',
        required: false,
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots[0].description).toBeUndefined();
    });

    it('updateSlot 修改 Slot 属性', async () => {
      const wu = await StorageService.createWorkUnit('编辑Slot');
      await StorageService.addSlot(wu.id, {
        name: '原始',
        slotType: 'context',
        required: false,
      });

      const added = await StorageService.getWorkUnit(wu.id);
      const slotId = added!.slots[0].id;
      await StorageService.updateSlot(wu.id, slotId, {
        name: '已修改',
        required: true,
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots[0].name).toBe('已修改');
      expect(updated!.slots[0].required).toBe(true);
      expect(updated!.slots[0].slotType).toBe('context');
    });

    it('deleteSlot 删除无 Capability 的 Slot', async () => {
      const wu = await StorageService.createWorkUnit('删除Slot');
      await StorageService.addSlot(wu.id, {
        name: '待删',
        slotType: 'custom',
        required: false,
      });

      const added = await StorageService.getWorkUnit(wu.id);
      const slotId = added!.slots[0].id;
      await StorageService.deleteSlot(wu.id, slotId);

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.slots).toHaveLength(0);
    });

    it('deleteSlot 拒绝删除有 Capability 的 Slot', async () => {
      const wu = await StorageService.createWorkUnit('有能力Slot');
      await StorageService.addSlot(wu.id, {
        name: '有内容',
        slotType: 'capability',
        required: true,
      });

      const added = await StorageService.getWorkUnit(wu.id);
      const slotId = added!.slots[0].id;

      // Manually add a capability to the slot for testing
      // (addCapability will be implemented in Task 4, so we do it manually here)
      const wuRecord = await StorageService.getWorkUnit(wu.id);
      wuRecord!.slots[0].capabilities.push({
        id: 'test-cap-1',
        name: '能力A',
        content: '内容',
        order: 0,
      });
      await StorageService._db.workUnits.update(wu.id, { slots: wuRecord!.slots });

      await expect(
        StorageService.deleteSlot(wu.id, slotId),
      ).rejects.toThrow('Slot 下仍有 Capability，无法删除');
    });

    it('addSlot 刷新 updatedAt', async () => {
      const wu = await StorageService.createWorkUnit('时间测试');
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.addSlot(wu.id, {
        name: 'T',
        slotType: 'context',
        required: false,
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.updatedAt).not.toBe(wu.updatedAt);
    });
  });
});
