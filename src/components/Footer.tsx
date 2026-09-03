import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer no-print">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <img
            className="site-footer-logo"
            src="/basil-cooking-planner/basil-logo-chalk.png"
            alt="Basil"
          />
          <span className="site-footer-tagline">{t('footer.tagline')}</span>
        </div>
        <div className="site-footer-meta">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <span className="site-footer-dot" aria-hidden="true">·</span>
          <span>{t('footer.madeWith')}</span>
        </div>
      </div>
    </footer>
  );
}
