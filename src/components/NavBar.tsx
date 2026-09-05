import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Calendar, CookingPot, Settings, type LucideIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { NavTools } from './NavTools';

export function NavBar() {
  const { t } = useTranslation();
  const familyName = useAppStore((s) => s.familyName);

  const links: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
    { to: '/new-plan', label: t('nav.newPlan'), icon: Sparkles },
    { to: '/plans', label: t('nav.plans'), icon: Calendar, end: true },
    { to: '/dishes', label: t('nav.dishes'), icon: CookingPot },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  function greeting(name: string): string {
    const hour = new Date().getHours();
    if (hour < 5)  return t('nav.greeting.night', { name });
    if (hour < 12) return t('nav.greeting.morning', { name });
    if (hour < 18) return t('nav.greeting.day', { name });
    return t('nav.greeting.evening', { name });
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand">
          <img src="/basil-cooking-planner/basil-logo-chalk.png" alt="Basil" className="nav-logo" />
        </NavLink>
        {familyName && (
          <span className="nav-greeting">{greeting(familyName)}</span>
        )}
        <div className="row nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <l.icon size={15} aria-hidden="true" /> {l.label}
            </NavLink>
          ))}
        </div>
        <NavTools />
      </div>
    </nav>
  );
}
