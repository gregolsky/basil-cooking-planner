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
        <div className="stack" style={{ textAlign: 'center', alignItems: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🌿</div>
          <h1 style={{ fontSize: '2.8rem', margin: 0 }}>Basil</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', color: 'var(--color-ink-soft)', margin: 0 }}>
            Family Cooking Planner
          </p>

          <hr style={{ width: '100%', border: 'none', borderTop: '2px dashed var(--color-parchment)', margin: '8px 0' }} />

          <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-ink)', margin: 0 }}>
            Jak nazywa się Twoja rodzina?
          </p>
          <input
            type="text"
            autoFocus
            placeholder="np. Kowalskich, Nowaków…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            style={{ width: '100%', fontSize: '1.1rem', textAlign: 'center' }}
          />
          <p className="muted" style={{ margin: 0 }}>
            Użyjemy tego, żeby Cię witać. Możesz zmienić w Dane.
          </p>
          <button
            onClick={confirm}
            disabled={!name.trim()}
            style={{ width: '100%', fontSize: '1rem', padding: '11px' }}
          >
            Witaj w Basilu 🌿
          </button>
        </div>
      </div>
    </div>
  );
}
