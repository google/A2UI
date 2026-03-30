import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import type { A2UIComponentProps } from '../core/types.js';
import { ComponentHost } from '../core/ComponentHost.js';
import { useA2UI } from '../core/A2UIProvider.js';

/**
 * Modal component — trigger element that opens a dialog with content.
 */
export const Modal = memo(function Modal({
  props,
  surfaceId,
  dataContextPath,
  registry,
}: A2UIComponentProps) {
  const { surfaceGroup } = useA2UI();
  const surface = surfaceGroup.getSurface(surfaceId);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const triggerId = props.trigger?.raw;
  const contentId = props.content?.raw;

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => setIsOpen(false);
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) closeModal();
    },
    [closeModal],
  );

  if (!surface) return null;

  if (!isOpen) {
    return (
      <div className="a2ui-modal">
        <div className="a2ui-modal__trigger" onClick={openModal} style={{ cursor: 'pointer' }}>
          {triggerId && (
            <ComponentHost
              surface={surface}
              componentId={triggerId}
              dataContextPath={dataContextPath}
              registry={registry}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="a2ui-modal">
      <dialog
        ref={dialogRef}
        className="a2ui-modal__dialog"
        onClick={handleBackdropClick}
      >
        <div className="a2ui-modal__content">
          <button
            className="a2ui-modal__close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            close
          </button>
          {contentId && (
            <ComponentHost
              surface={surface}
              componentId={contentId}
              dataContextPath={dataContextPath}
              registry={registry}
            />
          )}
        </div>
      </dialog>
    </div>
  );
});
