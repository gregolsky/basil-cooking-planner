import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export function WelcomeModal() {
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
          <img src="/cooking-plan/basil-logo.png" alt="Basil" style={{ height: 72, width: 'auto' }} />
          <p className="welcome-question">Jak nazywa się Twoja rodzina?</p>
          <input
            type="text"
            autoFocus
            placeholder="np. Kowalskich, Nowaków…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
          />
          <p className="muted">
            Użyjemy tego, żeby Cię witać.<br />Możesz zmienić później w Dane.
          </p>
          <button onClick={confirm} disabled={!name.trim()} className="welcome-btn">
            Witaj w Basilu 🌿
          </button>
        </div>
      </div>
    </div>
  );
}
