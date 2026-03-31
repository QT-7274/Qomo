/**
 * Qomo App — 路由入口
 *
 * W1 Story: 建立最小路由骨架。
 * - / → WorkUnitList（继续治理入口）
 * - /work-unit/:id → WorkUnitDetail（详情占位，W2a 承接）
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkUnitListComponent } from '../WorkUnitList';
import { WorkUnitDetailComponent } from '../WorkUnitDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkUnitListComponent />} />
        <Route path="/work-unit/:id" element={<WorkUnitDetailComponent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
