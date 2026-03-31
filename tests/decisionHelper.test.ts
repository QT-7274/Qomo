/**
 * B0.2 helper 函数测试
 *
 * 验证 decision / writeback / observation helper 的正确性。
 * 重点：分层分离、失败场景独立 outcome、helper 产出结构合规。
 */
import { describe, it, expect } from 'vitest';
import {
  createLaunchDecision,
  createWritebackSummary,
  createFailedWriteback,
  createDecisionEvent,
  createHandoffEvent,
  createWritebackEvent,
  createObservationEvent,
} from '../src/utils/decisionHelper';
import type { HandoffResult } from '../src/types/writeback.types';

describe('createLaunchDecision', () => {
  it('创建 continue 决策', () => {
    const d = createLaunchDecision({
      workUnitId: 'wu_1',
      snapshotVersionId: 'ver_1',
      resultType: 'continue',
    });
    expect(d.decisionId).toMatch(/^dec_/);
    expect(d.resultType).toBe('continue');
    expect(d.workUnitId).toBe('wu_1');
    expect(d.context.issues).toHaveLength(0);
    expect(d.selectedFallback).toBeUndefined();
  });

  it('创建 degrade 决策，包含问题和 fallback', () => {
    const d = createLaunchDecision({
      workUnitId: 'wu_2',
      snapshotVersionId: 'ver_2',
      resultType: 'degrade',
      issues: [{ capabilityName: 'MCP-X', issueType: 'missing' }],
      fallbackOptions: [{ optionType: 'degrade', description: '跳过 MCP-X' }],
      selectedFallback: { optionType: 'degrade', description: '跳过 MCP-X' },
    });
    expect(d.resultType).toBe('degrade');
    expect(d.context.issues).toHaveLength(1);
    expect(d.selectedFallback?.description).toBe('跳过 MCP-X');
  });

  it('创建 cancel 和 substitute 决策', () => {
    const cancel = createLaunchDecision({ workUnitId: 'wu_3', snapshotVersionId: 'ver_3', resultType: 'cancel' });
    const sub = createLaunchDecision({ workUnitId: 'wu_4', snapshotVersionId: 'ver_4', resultType: 'substitute' });
    expect(cancel.resultType).toBe('cancel');
    expect(sub.resultType).toBe('substitute');
  });

  it('substitute 决策正确携带 selectedFallback', () => {
    const d = createLaunchDecision({
      workUnitId: 'wu_5',
      snapshotVersionId: 'ver_5',
      resultType: 'substitute',
      issues: [{ capabilityName: 'MCP-Y', issueType: 'missing' }],
      selectedFallback: { optionType: 'substitute', description: '使用替代能力 Z' },
    });
    expect(d.resultType).toBe('substitute');
    expect(d.selectedFallback?.optionType).toBe('substitute');
    expect(d.selectedFallback?.description).toBe('使用替代能力 Z');
  });

  it('continue 决策自动忽略 selectedFallback', () => {
    const d = createLaunchDecision({
      workUnitId: 'wu_6',
      snapshotVersionId: 'ver_6',
      resultType: 'continue',
      selectedFallback: { optionType: 'degrade', description: '不应出现' },
    });
    expect(d.resultType).toBe('continue');
    expect(d.selectedFallback).toBeUndefined();
  });
});

describe('createWritebackSummary', () => {
  it('创建成功回写摘要', () => {
    const wb = createWritebackSummary({
      decisionId: 'dec_1',
      workUnitId: 'wu_1',
      snapshotVersionId: 'ver_1',
      decisionResult: 'continue',
      handoffResult: { resultType: 'copied', outcome: 'success', completedAt: '2026-03-31T00:00:00Z' },
      writebackOutcome: 'success',
    });
    expect(wb.writebackId).toMatch(/^wb_/);
    expect(wb.writebackOutcome).toBe('success');
    expect(wb.decisionResult).toBe('continue');
    expect(wb.handoffResult?.outcome).toBe('success');
    expect(wb.writebackFailureReason).toBeUndefined();
  });

  it('writebackOutcome 与 decisionResult 独立', () => {
    // 决策成功但回写失败
    const wb = createWritebackSummary({
      decisionId: 'dec_2',
      workUnitId: 'wu_2',
      snapshotVersionId: 'ver_2',
      decisionResult: 'continue',
      writebackOutcome: 'failure',
      writebackFailureReason: '网络超时',
    });
    expect(wb.decisionResult).toBe('continue');
    expect(wb.writebackOutcome).toBe('failure');
    expect(wb.writebackFailureReason).toBe('网络超时');
  });

  it('cancel 决策 → handoffResult 为 null 的回写', () => {
    const wb = createWritebackSummary({
      decisionId: 'dec_cancel',
      workUnitId: 'wu_cancel',
      snapshotVersionId: 'ver_cancel',
      decisionResult: 'cancel',
      writebackOutcome: 'skipped',
    });
    expect(wb.decisionResult).toBe('cancel');
    expect(wb.handoffResult).toBeNull();
    expect(wb.writebackOutcome).toBe('skipped');
  });
});

describe('createFailedWriteback', () => {
  it('创建失败回写，outcome 为 failure', () => {
    const wb = createFailedWriteback({ decisionId: 'dec_1', workUnitId: 'wu_1', snapshotVersionId: 'ver_1', decisionResult: 'continue', failureReason: 'DB 异常' });
    expect(wb.writebackOutcome).toBe('failure');
    expect(wb.writebackFailureReason).toBe('DB 异常');
    expect(wb.decisionResult).toBe('continue');
    expect(wb.handoffResult).toBeNull();
  });
});

describe('createDecisionEvent', () => {
  it('生成 decision_event 层事件', () => {
    const decision = createLaunchDecision({
      workUnitId: 'wu_1',
      snapshotVersionId: 'ver_1',
      resultType: 'continue',
      issues: [{ capabilityName: 'X', issueType: 'missing' }],
    });
    const evt = createDecisionEvent(decision);
    expect(evt.layer).toBe('decision_event');
    expect(evt.decisionResult).toBe('continue');
    expect(evt.hasCapabilityIssues).toBe(true);
    expect(evt.issueCount).toBe(1);
    expect(evt.eventId).toMatch(/^evt_/);
  });
});

describe('createHandoffEvent', () => {
  it('生成成功 handoff_event', () => {
    const hr: HandoffResult = { resultType: 'copied', outcome: 'success', completedAt: '2026-03-31T00:00:00Z' };
    const evt = createHandoffEvent('dec_1', 'wu_1', hr);
    expect(evt.layer).toBe('handoff_event');
    expect(evt.handoffOutcome).toBe('success');
    expect(evt.handoffMethod).toBe('copied');
    expect(evt.failureReason).toBeUndefined();
  });

  it('生成失败 handoff_event，failureReason 独立记录', () => {
    const hr: HandoffResult = { resultType: 'copied', outcome: 'failure', failureReason: 'Clipboard 不可用', completedAt: '2026-03-31T00:00:00Z' };
    const evt = createHandoffEvent('dec_1', 'wu_1', hr);
    expect(evt.layer).toBe('handoff_event');
    expect(evt.handoffOutcome).toBe('failure');
    expect(evt.failureReason).toBe('Clipboard 不可用');
  });
});

describe('createWritebackEvent', () => {
  it('生成成功 writeback_event', () => {
    const wb = createWritebackSummary({
      decisionId: 'dec_1',
      workUnitId: 'wu_1',
      snapshotVersionId: 'ver_1',
      decisionResult: 'continue',
      writebackOutcome: 'success',
    });
    const evt = createWritebackEvent(wb);
    expect(evt.layer).toBe('writeback_event');
    expect(evt.writebackOutcome).toBe('success');
    expect(evt.failureReason).toBeUndefined();
  });

  it('生成失败 writeback_event，failureReason 独立记录', () => {
    const wb = createFailedWriteback({ decisionId: 'dec_1', workUnitId: 'wu_1', snapshotVersionId: 'ver_1', decisionResult: 'continue', failureReason: 'DB 写入异常' });
    const evt = createWritebackEvent(wb);
    expect(evt.layer).toBe('writeback_event');
    expect(evt.writebackOutcome).toBe('failure');
    expect(evt.failureReason).toBe('DB 写入异常');
  });
});

describe('createObservationEvent', () => {
  it('生成 observation_event 层事件', () => {
    const evt = createObservationEvent('dec_1', 'wu_1', 'reuse_signal', 'recorded', '复用检测');
    expect(evt.layer).toBe('observation_event');
    expect(evt.observationOutcome).toBe('recorded');
    expect(evt.observationType).toBe('reuse_signal');
    expect(evt.summary).toBe('复用检测');
  });

  it('观测失败作为独立 outcome 记录', () => {
    const evt = createObservationEvent('dec_1', 'wu_1', 'general', 'failure', '数据缺失');
    expect(evt.observationOutcome).toBe('failure');
    expect(evt.summary).toBe('数据缺失');
  });
});
