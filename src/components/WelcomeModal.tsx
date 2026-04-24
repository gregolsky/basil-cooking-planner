import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';

export function WelcomeModal() {
  const { t } = useTranslation();
  const setFamilyName = useAppStore((s) => s.setFamilyName);
  const [name, setName] = useState('');

  const confirm = () => {
    if (!name.trim()) return;
    setFamilyName(name.trim());
  };

  return (
    <div className="modal-backdrop">
      <div className="modal welcome-modal">
        <div className="welcome-hero-strip" />
        <div className="welcome-body">
          <img src="/basil-cooking-planner/basil-logo.png" alt="Basil" style={{ height: 72, width: 'auto' }} />
          <p className="welcome-question">{t('welcome.question')}</p>
          <input
            type="text"
            autoFocus
            placeholder={t('welcome.placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
          />
          <p className="muted" style={{ whiteSpace: 'pre-line' }}>
            {t('welcome.hint')}
          </p>
          <button onClick={confirm} disabled={!name.trim()} className="welcome-btn">
            {t('welcome.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
