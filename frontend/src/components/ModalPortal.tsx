import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders modal UI on document.body so position:fixed covers the full viewport.
 * Ancestors with transform (e.g. .animate-fade-in on layout) otherwise clip fixed overlays.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
