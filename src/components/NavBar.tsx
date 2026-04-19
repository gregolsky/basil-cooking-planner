import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const links = [
  { to: '/new-plan', label: '✨ Nowy plan' },
  { to: '/plans', label: '📚 Plany', end: true },
  { to: '/dishes', label: '🥘 Dania' },
  { to: '/settings', label: '⚙️ Dane' },
];

function greeting(familyName: string): string {
  const hour = new Date().getHours();
  if (hour < 5)  return `Dobranoc, ${familyName}!`;
  if (hour < 12) return `Dzień dobry, ${familyName}!`;
  if (hour < 18) return `Cześć, ${familyName}!`;
  return `Dobry wieczór, ${familyName}!`;
}

export function NavBar() {
  const familyName = useAppStore((s) => s.familyName);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand">
          <img src="/basil-cooking-planner/basil-logo-chalk.png" alt="Basil" className="nav-logo" />
        </NavLink>
        {familyName && (
          <span className="nav-greeting">{greeting(familyName)}</span>
        )}
        <div className="row" style={{ marginLeft: 'auto' }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
