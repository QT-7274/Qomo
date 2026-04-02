/**
 * Qomo App — 路由入口
 *
 * W1 Story: 建立最小路由骨架。
 * V1 Story: 新增启动台路由。
 * - / → WorkUnitList（设计台·继续治理入口）
 * - /work-unit/:id → WorkUnitDetail（详情编辑）
 * - /launch → LaunchPanel（启动台·对象选择）
 * - /launch/:id → LaunchSession（启动会话）
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkUnitListComponent } from '../WorkUnitList';
import { WorkUnitDetailComponent } from '../WorkUnitDetail';
import { LaunchPanelComponent } from '../LaunchPanel';
import { LaunchSessionComponent } from '../LaunchSession';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkUnitListComponent />} />
        <Route path="/work-unit/:id" element={<WorkUnitDetailComponent />} />
        <Route path="/launch" element={<LaunchPanelComponent />} />
        <Route path="/launch/:id" element={<LaunchSessionComponent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
