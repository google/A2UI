import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';
import { ComponentNode } from '../../core/ComponentNode';

/**
 * Modal component - displays content in a dialog overlay.
 *
 * The entryPointChild component triggers the modal to open.
 * The contentChild is displayed inside the modal dialog.
 */
export const Modal = memo(function Modal({ node, surfaceId }: A2UIComponentProps<Types.ModalNode>) {
  const { theme } = useA2UIComponent(node, surfaceId);
  const props = node.properties;

  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Sync dialog element state with React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle backdrop clicks
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const dialog = dialogRef.current;
      if (dialog && e.target === dialog) {
        closeModal();
      }
    },
    [closeModal]
  );

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    },
    [closeModal]
  );

  const dialogContent = (
    <dialog
      ref={dialogRef}
      className={classMapToString(theme.components.Modal.element)}
      style={stylesToObject(theme.additionalStyles?.Modal)}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="a2ui-modal__content">
        <button
          className="a2ui-modal__close"
          onClick={closeModal}
          aria-label="Close modal"
        >
          ×
        </button>
        <ComponentNode node={props.contentChild} surfaceId={surfaceId} />
      </div>
    </dialog>
  );

  // Apply --weight CSS variable on root div (:host equivalent) for flex layouts
  const hostStyle: React.CSSProperties = {
    cursor: 'pointer',
    ...(node.weight !== undefined ? { '--weight': node.weight } as React.CSSProperties : {}),
  };

  return (
    <>
      {/* Entry point (trigger) - also serves as :host equivalent */}
      <div className="a2ui-modal" onClick={openModal} style={hostStyle}>
        <ComponentNode node={props.entryPointChild} surfaceId={surfaceId} />
      </div>

      {/* Modal dialog - rendered in portal */}
      {isOpen && createPortal(dialogContent, document.body)}
    </>
  );
});

export default Modal;
