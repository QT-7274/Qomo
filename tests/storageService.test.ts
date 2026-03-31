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
});
