import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { NavBar } from './components/NavBar';
import { WelcomeModal } from './components/WelcomeModal';
import { DishesPage } from './pages/DishesPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { ExtendPlanPage } from './pages/ExtendPlanPage';
import { PlansListPage } from './pages/PlansListPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportPage } from './pages/ImportPage';

export default function App() {
  const familyName = useAppStore((s) => s.familyName);

  return (
    <>
      {familyName === null && <WelcomeModal />}
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/dishes" element={<DishesPage />} />
        <Route path="/new-plan" element={<GeneratorPage />} />
        <Route path="/extend-plan/:id" element={<ExtendPlanPage />} />
        <Route path="/plans" element={<PlansListPage />} />
        <Route path="/plans/:id" element={<PlanDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="*" element={<Navigate to="/plans" replace />} />
      </Routes>
    </>
  );
}
