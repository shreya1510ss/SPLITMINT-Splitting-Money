import { useEffect } from 'react';

let lockCount = 0;

/**
 * Locks document scroll while a modal is open so the page behind does not move.
 * Uses overflow hidden + position:fixed (with scroll restore) so iOS/Safari and
 * wheel events don’t move the layout behind the overlay.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    lockCount += 1;
    if (lockCount === 1) {
      const scrollY = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.dataset.scrollLockY = String(scrollY);
    }

    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        const y = document.body.dataset.scrollLockY;
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        delete document.body.dataset.scrollLockY;
        if (y !== undefined) {
          window.scrollTo(0, Number.parseInt(y, 10) || 0);
        }
      }
    };
  }, [locked]);
}
