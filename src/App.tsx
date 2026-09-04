import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DishesPage } from './pages/DishesPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { ExtendPlanPage } from './pages/ExtendPlanPage';
import { PlansListPage } from './pages/PlansListPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportPage } from './pages/ImportPage';
import { StyleGuidePage } from './pages/StyleGuidePage';

export default function App() {
  const familyName = useAppStore((s) => s.familyName);
  const location = useLocation();
  const isWelcome = location.pathname === '/welcome';

  // First-run users must complete onboarding before anything else, regardless
  // of entry point (deep link, share link, browser back/forward, stale
  // bookmark) — WelcomeModal used to guarantee this by overlaying every
  // route; /welcome is a full page, so the guarantee has to live here instead.
  if (familyName === null && !isWelcome) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      {!isWelcome && <NavBar />}
      <Routes>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/welcome" element={<HomePage />} />
        <Route path="/dishes" element={<DishesPage />} />
        <Route path="/new-plan" element={<GeneratorPage />} />
        <Route path="/extend-plan/:id" element={<ExtendPlanPage />} />
        <Route path="/plans" element={<PlansListPage />} />
        <Route path="/plans/:id" element={<PlanDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/style-guide" element={<StyleGuidePage />} />
        <Route path="*" element={<Navigate to="/plans" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
