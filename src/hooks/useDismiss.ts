import { useEffect, type RefObject } from 'react';

interface UseDismissOptions {
  /** Called on Escape, and on an outside click when `containerRef` is given. */
  onDismiss: () => void;
  /** Skip attaching listeners entirely, e.g. while a menu/modal is closed. */
  active: boolean;
  /** When set, a mousedown outside this element also triggers `onDismiss`. */
  containerRef?: RefObject<HTMLElement | null>;
}

/** Shared Escape-key (and optional outside-click) dismiss behavior for menus/modals. */
export function useDismiss({ onDismiss, active, containerRef }: UseDismissOptions) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef?.current && !containerRef.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    if (containerRef) document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (containerRef) document.removeEventListener('mousedown', onMouseDown);
    };
  }, [active, onDismiss, containerRef]);
}
