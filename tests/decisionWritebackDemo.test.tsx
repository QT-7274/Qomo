/**
 * B0.2 演示组件渲染测试
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DecisionWritebackDemo } from '../src/components/DecisionWritebackDemo';

describe('DecisionWritebackDemo', () => {
  it('渲染标题', () => {
    render(<DecisionWritebackDemo />);
    expect(screen.getByText(/B0.2 Decision \/ Writeback \/ Observation 分层演示/)).toBeDefined();
  });

  it('渲染三个场景标题', () => {
    render(<DecisionWritebackDemo />);
    const scenarios = screen.getAllByText(/^场景 \d/);
    expect(scenarios.length).toBeGreaterThanOrEqual(3);
  });

  it('每个场景都有观测事件表格', () => {
    render(<DecisionWritebackDemo />);
    const eventHeaders = screen.getAllByText(/观测事件/);
    expect(eventHeaders.length).toBeGreaterThanOrEqual(3);
  });

  it('展示四层事件类型', () => {
    render(<DecisionWritebackDemo />);
    expect(screen.getAllByText('decision_event').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('handoff_event').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('writeback_event').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('observation_event').length).toBeGreaterThanOrEqual(1);
  });
});
