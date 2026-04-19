import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { NavBar } from './components/NavBar';
import { WelcomeModal } from './components/WelcomeModal';
import { CalendarPage } from './pages/CalendarPage';
import { DishesPage } from './pages/DishesPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { PlansListPage } from './pages/PlansListPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportPage } from './pages/ImportPage';

export default function App() {
  const familyName = useAppStore((s) => s.familyName);

  return (
    <>
      {familyName === null && <WelcomeModal />}
      <NavBar />
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/dishes" element={<DishesPage />} />
        <Route path="/new-plan" element={<GeneratorPage />} />
        <Route path="/plans" element={<PlansListPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
