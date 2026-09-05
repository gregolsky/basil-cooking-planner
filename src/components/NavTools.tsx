import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

/**
 * Inline SVG rather than the 🇵🇱/🇬🇧 emoji: regional-indicator flags don't
 * render at all on most Windows builds, and the redesign moved the app off
 * emoji as an icon system. Drawn at 3:2 with a hairline so the white bands
 * stay defined against the dark nav.
 */
function FlagPl({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 40" width={size * 1.5} height={size} aria-hidden="true" className="nav-flag-svg">
      <rect width="60" height="20" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#DC143C" />
    </svg>
  );
}

function FlagGb({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 40" width={size * 1.5} height={size} aria-hidden="true" className="nav-flag-svg">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

/** Language names stay in their own language, never translated. */
const LOCALES = [
  { code: 'pl', name: 'Polski', Flag: FlagPl },
  { code: 'en', name: 'English', Flag: FlagGb },
] as const;

export function NavTools() {
  const { t } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const nextTheme = theme === 'prl' ? 'trattoria' : 'prl';
  const nextThemeName = t(nextTheme === 'prl' ? 'settings.themePrl' : 'settings.themeTrattoria');

  return (
    <div className="nav-tools">
      <div className="nav-flags" role="group" aria-label={t('nav.language')}>
        {LOCALES.map(({ code, name, Flag }) => (
          <button
            key={code}
            type="button"
            className="nav-flag"
            aria-label={name}
            aria-pressed={locale === code}
            title={name}
            onClick={() => setLocale(code)}
          >
            <Flag />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="icon-btn nav-theme-toggle"
        onClick={() => setTheme(nextTheme)}
        aria-label={t('nav.switchThemeTo', { theme: nextThemeName })}
        title={t('nav.switchThemeTo', { theme: nextThemeName })}
      >
        <Palette size={17} />
      </button>
    </div>
  );
}
