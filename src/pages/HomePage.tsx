import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';

const STEPS = [
  { numeral: 'I', image: 'step-cookbook.webp', titleKey: 'home.step1.title', bodyKey: 'home.step1.body' },
  { numeral: 'II', image: 'step-prep.webp', titleKey: 'home.step2.title', bodyKey: 'home.step2.body' },
  { numeral: 'III', image: 'step-cooking.webp', titleKey: 'home.step3.title', bodyKey: 'home.step3.body' },
] as const;

const FEATURE_KEYS = ['home.feature1', 'home.feature2', 'home.feature3', 'home.feature4'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setFamilyName = useAppStore((s) => s.setFamilyName);
  const [name, setName] = useState('');

  const confirm = () => {
    if (!name.trim()) return;
    setFamilyName(name.trim());
    navigate('/plans');
  };

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-hero-overlay">
          <div className="home-hero-content">
            <div className="home-hero-text">
              <img className="home-wordmark" src="/basil-cooking-planner/basil-logo-chalk.png" alt="Basil" />
              <h1 className="home-lead">{t('home.lead')}</h1>
            </div>

            <form
              className="home-signup"
              onSubmit={(e) => { e.preventDefault(); confirm(); }}
            >
              <label className="home-signup-line">
                {t('home.nameBlank')}
                <input
                  type="text"
                  autoFocus
                  className="home-name-input"
                  placeholder={t('home.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button type="submit" disabled={!name.trim()}>{t('home.submit')}</button>
              <div className="muted" style={{ marginTop: 10 }}>{t('home.hint')}</div>
            </form>
          </div>
        </div>
        <div className="home-scroll-hint">
          <span className="home-scroll-hint-label">{t('home.learnMore')}</span>
          <span aria-hidden="true">⌄</span>
        </div>
      </div>

      <div className="page home-body">
        <section className="home-steps">
          <span className="eyebrow">{t('home.stepsTitle')}</span>
          <div className="home-steps-flow">
            {STEPS.map((s, i) => (
              <Fragment key={s.numeral}>
                <span className="home-step-numeral">{s.numeral}.</span>
                {i < STEPS.length - 1 && <span className="home-flow-line" />}
              </Fragment>
            ))}
          </div>
          <div className="home-steps-grid">
            {STEPS.map((s) => (
              <div key={s.numeral} className="home-step">
                <img
                  className="home-step-image"
                  src={`/basil-cooking-planner/${s.image}`}
                  alt=""
                />
                <h3 className="home-step-title">
                  <span className="home-step-inline-numeral" aria-hidden="true">{s.numeral}.</span>
                  {t(s.titleKey)}
                </h3>
                <p className="muted">{t(s.bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="row home-features">
          {FEATURE_KEYS.map((k) => (
            <span key={k} className="badge soft">{t(k)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
