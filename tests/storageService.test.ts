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
    await StorageService._db.workUnitVersions.clear();
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

  describe('Capability CRUD', () => {
    async function createWorkUnitWithSlot() {
      const wu = await StorageService.createWorkUnit('能力测试');
      await StorageService.addSlot(wu.id, {
        name: '能力挂载',
        slotType: 'capability',
        required: true,
      });
      const updated = await StorageService.getWorkUnit(wu.id);
      return { workUnitId: wu.id, slotId: updated!.slots[0].id };
    }

    it('addCapability 添加到指定 Slot', async () => {
      const { workUnitId, slotId } = await createWorkUnitWithSlot();
      await StorageService.addCapability(workUnitId, slotId, {
        name: '代码审查',
        content: '审查代码质量',
      });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const caps = wu!.slots[0].capabilities;
      expect(caps).toHaveLength(1);
      expect(caps[0].name).toBe('代码审查');
      expect(caps[0].content).toBe('审查代码质量');
      expect(caps[0].order).toBe(0);
      expect(caps[0].id).toBeTruthy();
    });

    it('addCapability 自动递增 order', async () => {
      const { workUnitId, slotId } = await createWorkUnitWithSlot();
      await StorageService.addCapability(workUnitId, slotId, { name: 'A', content: '内容A' });
      await StorageService.addCapability(workUnitId, slotId, { name: 'B', content: '内容B' });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const caps = wu!.slots[0].capabilities;
      expect(caps[0].order).toBe(0);
      expect(caps[1].order).toBe(1);
    });

    it('updateCapability 修改内容', async () => {
      const { workUnitId, slotId } = await createWorkUnitWithSlot();
      await StorageService.addCapability(workUnitId, slotId, { name: '原始', content: '原始内容' });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const capId = wu!.slots[0].capabilities[0].id;
      await StorageService.updateCapability(workUnitId, slotId, capId, {
        name: '已修改',
        content: '新内容',
      });

      const updated = await StorageService.getWorkUnit(workUnitId);
      expect(updated!.slots[0].capabilities[0].name).toBe('已修改');
      expect(updated!.slots[0].capabilities[0].content).toBe('新内容');
    });

    it('deleteCapability 删除指定能力', async () => {
      const { workUnitId, slotId } = await createWorkUnitWithSlot();
      await StorageService.addCapability(workUnitId, slotId, { name: 'A', content: '内容A' });
      await StorageService.addCapability(workUnitId, slotId, { name: 'B', content: '内容B' });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const capId = wu!.slots[0].capabilities[0].id;
      await StorageService.deleteCapability(workUnitId, slotId, capId);

      const updated = await StorageService.getWorkUnit(workUnitId);
      expect(updated!.slots[0].capabilities).toHaveLength(1);
      expect(updated!.slots[0].capabilities[0].name).toBe('B');
    });

    it('reorderCapabilities 重新排序', async () => {
      const { workUnitId, slotId } = await createWorkUnitWithSlot();
      await StorageService.addCapability(workUnitId, slotId, { name: 'A', content: '内容A' });
      await StorageService.addCapability(workUnitId, slotId, { name: 'B', content: '内容B' });
      await StorageService.addCapability(workUnitId, slotId, { name: 'C', content: '内容C' });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const caps = wu!.slots[0].capabilities;
      // 新顺序：C, A, B
      const newOrder = [caps[2].id, caps[0].id, caps[1].id];
      await StorageService.reorderCapabilities(workUnitId, slotId, newOrder);

      const updated = await StorageService.getWorkUnit(workUnitId);
      const reordered = updated!.slots[0].capabilities;
      expect(reordered[0].name).toBe('C');
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].name).toBe('A');
      expect(reordered[1].order).toBe(1);
      expect(reordered[2].name).toBe('B');
      expect(reordered[2].order).toBe(2);
    });
  });

  describe('cloneWorkUnit', () => {
    it('创建含相同结构的副本', async () => {
      const original = await StorageService.createWorkUnit('原始');
      await StorageService.updateWorkUnitInfo(original.id, { description: '原始描述' });
      await StorageService.addSlot(original.id, {
        name: '上下文',
        slotType: 'context',
        required: true,
      });

      const origWu = await StorageService.getWorkUnit(original.id);
      const slotId = origWu!.slots[0].id;
      await StorageService.addCapability(original.id, slotId, {
        name: '能力A',
        content: '内容A',
      });

      const clone = await StorageService.cloneWorkUnit(original.id);

      expect(clone.id).not.toBe(original.id);
      expect(clone.name).toBe('原始（副本）');
      expect(clone.description).toBe('原始描述');
      expect(clone.sourceType).toBe('cloned_from');
      expect(clone.slots).toHaveLength(1);
      expect(clone.slots[0].name).toBe('上下文');
      expect(clone.slots[0].capabilities).toHaveLength(1);
      expect(clone.slots[0].capabilities[0].name).toBe('能力A');
    });

    it('副本的 Slot/Capability ID 与原始不同', async () => {
      const original = await StorageService.createWorkUnit('原始');
      await StorageService.addSlot(original.id, {
        name: '规则',
        slotType: 'rule',
        required: false,
      });

      const origWu = await StorageService.getWorkUnit(original.id);
      const slotId = origWu!.slots[0].id;
      await StorageService.addCapability(original.id, slotId, {
        name: 'C',
        content: '内容',
      });

      // Re-fetch after adding capability
      const origAfterCap = await StorageService.getWorkUnit(original.id);
      const clone = await StorageService.cloneWorkUnit(original.id);

      expect(clone.slots[0].id).not.toBe(origAfterCap!.slots[0].id);
      expect(clone.slots[0].capabilities[0].id).not.toBe(
        origAfterCap!.slots[0].capabilities[0].id,
      );
    });

    it('副本在列表中可查到', async () => {
      const original = await StorageService.createWorkUnit('待复制');
      await StorageService.cloneWorkUnit(original.id);

      const list = await StorageService.listWorkUnits();
      expect(list).toHaveLength(2);
      expect(list.some((wu) => wu.name === '待复制（副本）')).toBe(true);
    });

    it('克隆不存在的 Work Unit 抛错', async () => {
      await expect(
        StorageService.cloneWorkUnit('nonexistent'),
      ).rejects.toThrow('Work Unit nonexistent 不存在');
    });

    it('副本包含深拷贝的约束（含检查清单）', async () => {
      const original = await StorageService.createWorkUnit('带约束原始');
      await StorageService.addConstraint(original.id, {
        name: '质量检查',
        constraintType: 'quality',
        content: '自检',
        checklistItems: [{ text: '检查拼写', required: true }],
      });
      await StorageService.addConstraint(original.id, {
        name: '输出格式',
        constraintType: 'output',
        content: 'Markdown',
        outputFormat: 'markdown',
        lengthLimit: { unit: 'words', max: 200 },
      });

      const clone = await StorageService.cloneWorkUnit(original.id);

      expect(clone.constraints).toHaveLength(2);
      expect(clone.constraints[0].name).toBe('质量检查');
      expect(clone.constraints[0].checklistItems).toHaveLength(1);
      expect(clone.constraints[0].checklistItems![0].text).toBe('检查拼写');
      expect(clone.constraints[1].outputFormat).toBe('markdown');
      expect(clone.constraints[1].lengthLimit).toEqual({ unit: 'words', max: 200 });

      // 验证 ID 不同
      const origWu = await StorageService.getWorkUnit(original.id);
      expect(clone.constraints[0].id).not.toBe(origWu!.constraints[0].id);
      expect(clone.constraints[0].checklistItems![0].id).not.toBe(
        origWu!.constraints[0].checklistItems![0].id,
      );
    });
  });

  describe('schema v3 — constraints', () => {
    it('创建 Work Unit 后 constraints 默认为空数组', async () => {
      const record = await StorageService.createWorkUnit('带约束');
      expect(record.constraints).toEqual([]);
    });
  });

  describe('Constraint CRUD', () => {
    it('addConstraint 添加约束包', async () => {
      const wu = await StorageService.createWorkUnit('约束测试');
      await StorageService.addConstraint(wu.id, {
        name: '输出格式',
        constraintType: 'output',
        content: '使用 Markdown',
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints).toHaveLength(1);
      expect(updated!.constraints[0].name).toBe('输出格式');
      expect(updated!.constraints[0].constraintType).toBe('output');
      expect(updated!.constraints[0].content).toBe('使用 Markdown');
      expect(updated!.constraints[0].order).toBe(0);
      expect(updated!.constraints[0].id).toBeTruthy();
    });

    it('addConstraint output 类型含格式和长度限制', async () => {
      const wu = await StorageService.createWorkUnit('输出约束');
      await StorageService.addConstraint(wu.id, {
        name: 'JSON 输出',
        constraintType: 'output',
        content: '输出 JSON',
        outputFormat: 'json',
        lengthLimit: { unit: 'words', max: 500 },
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints[0].outputFormat).toBe('json');
      expect(updated!.constraints[0].lengthLimit).toEqual({ unit: 'words', max: 500 });
    });

    it('addConstraint quality 类型含检查清单', async () => {
      const wu = await StorageService.createWorkUnit('质量约束');
      await StorageService.addConstraint(wu.id, {
        name: '质量检查',
        constraintType: 'quality',
        content: '自检清单',
        checklistItems: [
          { text: '检查拼写', required: true },
          { text: '验证引用', required: false },
        ],
      });

      const updated = await StorageService.getWorkUnit(wu.id);
      const items = updated!.constraints[0].checklistItems!;
      expect(items).toHaveLength(2);
      expect(items[0].text).toBe('检查拼写');
      expect(items[0].required).toBe(true);
      expect(items[0].order).toBe(0);
      expect(items[1].order).toBe(1);
      expect(items[0].id).toBeTruthy();
    });

    it('addConstraint 自动递增 order', async () => {
      const wu = await StorageService.createWorkUnit('排序');
      await StorageService.addConstraint(wu.id, { name: 'A', constraintType: 'output', content: 'a' });
      await StorageService.addConstraint(wu.id, { name: 'B', constraintType: 'boundary', content: 'b' });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints[0].order).toBe(0);
      expect(updated!.constraints[1].order).toBe(1);
    });

    it('updateConstraint 修改属性', async () => {
      const wu = await StorageService.createWorkUnit('编辑约束');
      await StorageService.addConstraint(wu.id, { name: '原始', constraintType: 'boundary', content: '旧内容' });

      const added = await StorageService.getWorkUnit(wu.id);
      const cId = added!.constraints[0].id;
      await StorageService.updateConstraint(wu.id, cId, { name: '已修改', content: '新内容' });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints[0].name).toBe('已修改');
      expect(updated!.constraints[0].content).toBe('新内容');
    });

    it('deleteConstraint 删除约束包', async () => {
      const wu = await StorageService.createWorkUnit('删除约束');
      await StorageService.addConstraint(wu.id, { name: 'A', constraintType: 'output', content: 'a' });

      const added = await StorageService.getWorkUnit(wu.id);
      const cId = added!.constraints[0].id;
      await StorageService.deleteConstraint(wu.id, cId);

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints).toHaveLength(0);
    });

    it('reorderConstraints 重新排序', async () => {
      const wu = await StorageService.createWorkUnit('约束排序');
      await StorageService.addConstraint(wu.id, { name: 'A', constraintType: 'output', content: 'a' });
      await StorageService.addConstraint(wu.id, { name: 'B', constraintType: 'boundary', content: 'b' });
      await StorageService.addConstraint(wu.id, { name: 'C', constraintType: 'quality', content: 'c' });

      const before = await StorageService.getWorkUnit(wu.id);
      const ids = before!.constraints.map((c) => c.id);
      await StorageService.reorderConstraints(wu.id, [ids[2], ids[0], ids[1]]);

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.constraints[0].name).toBe('C');
      expect(updated!.constraints[0].order).toBe(0);
      expect(updated!.constraints[1].name).toBe('A');
      expect(updated!.constraints[2].name).toBe('B');
    });

    it('addConstraint 刷新 updatedAt', async () => {
      const wu = await StorageService.createWorkUnit('时间');
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.addConstraint(wu.id, { name: 'T', constraintType: 'output', content: 't' });

      const updated = await StorageService.getWorkUnit(wu.id);
      expect(updated!.updatedAt).not.toBe(wu.updatedAt);
    });
  });

  describe('ChecklistItem CRUD', () => {
    async function createWuWithQualityConstraint() {
      const wu = await StorageService.createWorkUnit('检查清单测试');
      await StorageService.addConstraint(wu.id, {
        name: '质量检查',
        constraintType: 'quality',
        content: '自检',
        checklistItems: [],
      });
      const updated = await StorageService.getWorkUnit(wu.id);
      return { workUnitId: wu.id, constraintId: updated!.constraints[0].id };
    }

    it('addChecklistItem 添加检查项', async () => {
      const { workUnitId, constraintId } = await createWuWithQualityConstraint();
      await StorageService.addChecklistItem(workUnitId, constraintId, {
        text: '检查拼写',
        required: true,
      });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const items = wu!.constraints[0].checklistItems!;
      expect(items).toHaveLength(1);
      expect(items[0].text).toBe('检查拼写');
      expect(items[0].required).toBe(true);
      expect(items[0].order).toBe(0);
    });

    it('addChecklistItem 自动递增 order', async () => {
      const { workUnitId, constraintId } = await createWuWithQualityConstraint();
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: 'A', required: true });
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: 'B', required: false });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const items = wu!.constraints[0].checklistItems!;
      expect(items[0].order).toBe(0);
      expect(items[1].order).toBe(1);
    });

    it('updateChecklistItem 修改检查项', async () => {
      const { workUnitId, constraintId } = await createWuWithQualityConstraint();
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: '原始', required: false });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const itemId = wu!.constraints[0].checklistItems![0].id;
      await StorageService.updateChecklistItem(workUnitId, constraintId, itemId, {
        text: '已修改',
        required: true,
      });

      const updated = await StorageService.getWorkUnit(workUnitId);
      const item = updated!.constraints[0].checklistItems![0];
      expect(item.text).toBe('已修改');
      expect(item.required).toBe(true);
    });

    it('deleteChecklistItem 删除检查项', async () => {
      const { workUnitId, constraintId } = await createWuWithQualityConstraint();
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: 'A', required: true });
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: 'B', required: false });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const itemId = wu!.constraints[0].checklistItems![0].id;
      await StorageService.deleteChecklistItem(workUnitId, constraintId, itemId);

      const updated = await StorageService.getWorkUnit(workUnitId);
      expect(updated!.constraints[0].checklistItems).toHaveLength(1);
      expect(updated!.constraints[0].checklistItems![0].text).toBe('B');
    });

    it('reorderChecklistItems 重排检查项', async () => {
      const { workUnitId, constraintId } = await createWuWithQualityConstraint();
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: 'A', required: true });
      await StorageService.addChecklistItem(workUnitId, constraintId, { text: 'B', required: false });

      const wu = await StorageService.getWorkUnit(workUnitId);
      const items = wu!.constraints[0].checklistItems!;
      await StorageService.reorderChecklistItems(workUnitId, constraintId, [items[1].id, items[0].id]);

      const updated = await StorageService.getWorkUnit(workUnitId);
      const reordered = updated!.constraints[0].checklistItems!;
      expect(reordered[0].text).toBe('B');
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].text).toBe('A');
      expect(reordered[1].order).toBe(1);
    });
  });

  describe('setSlotFillIn', () => {
    it('为 Slot 设置待补齐声明', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'user-confirm', hint: '请描述任务目标' });

      const after2 = await StorageService.getWorkUnit(wu.id);
      const slot = after2!.slots[0];
      expect(slot.fillIn).toBeDefined();
      expect(slot.fillIn!.method).toBe('user-confirm');
      expect(slot.fillIn!.hint).toBe('请描述任务目标');
    });

    it('更新已有的待补齐声明', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '文件', slotType: 'context', required: false });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'auto' });
      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'manual', hint: '手动补充' });

      const after2 = await StorageService.getWorkUnit(wu.id);
      expect(after2!.slots[0].fillIn!.method).toBe('manual');
      expect(after2!.slots[0].fillIn!.hint).toBe('手动补充');
    });

    it('设置后刷新 updatedAt', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;
      const oldUpdated = after1!.updatedAt;

      await new Promise((r) => setTimeout(r, 10));
      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'auto' });

      const after2 = await StorageService.getWorkUnit(wu.id);
      expect(after2!.updatedAt > oldUpdated).toBe(true);
    });

    it('Work Unit 不存在时抛错', async () => {
      await expect(
        StorageService.setSlotFillIn('nonexistent', 'slot-1', { method: 'auto' })
      ).rejects.toThrow('不存在');
    });

    it('Slot 不存在时抛错', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await expect(
        StorageService.setSlotFillIn(wu.id, 'nonexistent', { method: 'auto' })
      ).rejects.toThrow('不存在');
    });
  });

  describe('clearSlotFillIn', () => {
    it('清除已有的待补齐声明', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'manual', hint: '手动' });
      await StorageService.clearSlotFillIn(wu.id, slotId);

      const after2 = await StorageService.getWorkUnit(wu.id);
      expect(after2!.slots[0].fillIn).toBeUndefined();
    });

    it('无待补齐声明时清除也不报错', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;

      await expect(
        StorageService.clearSlotFillIn(wu.id, slotId)
      ).resolves.not.toThrow();
    });
  });

  describe('cloneWorkUnit with fillIn', () => {
    it('复制时保留 Slot 的 fillIn 声明', async () => {
      const wu = await StorageService.createWorkUnit('源');
      await StorageService.addSlot(wu.id, { name: '任务目标', slotType: 'context', required: true });
      const after1 = await StorageService.getWorkUnit(wu.id);
      const slotId = after1!.slots[0].id;
      await StorageService.setSlotFillIn(wu.id, slotId, { method: 'user-confirm', hint: '描述任务' });

      const cloned = await StorageService.cloneWorkUnit(wu.id);

      expect(cloned.slots[0].fillIn).toBeDefined();
      expect(cloned.slots[0].fillIn!.method).toBe('user-confirm');
      expect(cloned.slots[0].fillIn!.hint).toBe('描述任务');
      expect(cloned.slots[0].id).not.toBe(slotId);
    });
  });

  describe('createSnapshot', () => {
    it('创建快照并返回版本记录', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.addSlot(wu.id, { name: '目标', slotType: 'context', required: true });
      const after = await StorageService.getWorkUnit(wu.id);
      await StorageService.addCapability(wu.id, after!.slots[0].id, { name: 'C', content: '内容' });

      const snapshot = await StorageService.createSnapshot(wu.id);

      expect(snapshot.id).toBeTruthy();
      expect(snapshot.workUnitId).toBe(wu.id);
      expect(snapshot.versionNumber).toBe(1);
      expect(snapshot.contentHash).toBeTruthy();
      expect(snapshot.createdAt).toBeTruthy();
      const parsed = JSON.parse(snapshot.content);
      expect(parsed.name).toBe('测试');
      expect(parsed.slots).toHaveLength(1);
    });

    it('版本号自增', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const s1 = await StorageService.createSnapshot(wu.id);
      const s2 = await StorageService.createSnapshot(wu.id);
      expect(s1.versionNumber).toBe(1);
      expect(s2.versionNumber).toBe(2);
    });

    it('超过 5 个快照自动清理最旧', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      for (let i = 0; i < 6; i++) {
        await StorageService.createSnapshot(wu.id);
      }
      const list = await StorageService.listSnapshots(wu.id);
      expect(list).toHaveLength(5);
      expect(list.every((s) => s.versionNumber >= 2)).toBe(true);
    });

    it('相同内容生成相同哈希', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const s1 = await StorageService.createSnapshot(wu.id);
      const s2 = await StorageService.createSnapshot(wu.id);
      expect(s1.contentHash).toBe(s2.contentHash);
    });

    it('不同内容生成不同哈希', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const s1 = await StorageService.createSnapshot(wu.id);
      await StorageService.updateWorkUnitInfo(wu.id, { name: '已修改' });
      const s2 = await StorageService.createSnapshot(wu.id);
      expect(s1.contentHash).not.toBe(s2.contentHash);
    });

    it('Work Unit 不存在时抛错', async () => {
      await expect(StorageService.createSnapshot('nonexistent')).rejects.toThrow('不存在');
    });
  });

  describe('listSnapshots', () => {
    it('按时间倒序返回', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.createSnapshot(wu.id);
      await new Promise((r) => setTimeout(r, 10));
      await StorageService.createSnapshot(wu.id);

      const list = await StorageService.listSnapshots(wu.id);
      expect(list).toHaveLength(2);
      expect(list[0].versionNumber).toBe(2);
      expect(list[1].versionNumber).toBe(1);
    });

    it('无快照返回空数组', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      const list = await StorageService.listSnapshots(wu.id);
      expect(list).toEqual([]);
    });
  });

  describe('restoreSnapshot', () => {
    it('恢复快照覆盖当前内容', async () => {
      const wu = await StorageService.createWorkUnit('原始');
      await StorageService.addSlot(wu.id, { name: '原始Slot', slotType: 'context', required: true });
      await StorageService.createSnapshot(wu.id);

      await StorageService.updateWorkUnitInfo(wu.id, { name: '已修改', description: '新描述' });

      const list = await StorageService.listSnapshots(wu.id);
      await StorageService.restoreSnapshot(wu.id, list[0].id);

      const restored = await StorageService.getWorkUnit(wu.id);
      expect(restored!.name).toBe('原始');
      expect(restored!.slots).toHaveLength(1);
      expect(restored!.slots[0].name).toBe('原始Slot');
    });

    it('恢复后 updatedAt 刷新', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await StorageService.createSnapshot(wu.id);
      const before = await StorageService.getWorkUnit(wu.id);

      await new Promise((r) => setTimeout(r, 10));
      const list = await StorageService.listSnapshots(wu.id);
      await StorageService.restoreSnapshot(wu.id, list[0].id);

      const after = await StorageService.getWorkUnit(wu.id);
      expect(after!.updatedAt > before!.updatedAt).toBe(true);
    });

    it('快照不存在时抛错', async () => {
      const wu = await StorageService.createWorkUnit('测试');
      await expect(StorageService.restoreSnapshot(wu.id, 'nonexistent')).rejects.toThrow('不存在');
    });
  });
});
