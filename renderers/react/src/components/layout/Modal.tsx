/**
 * A2UI Modal Component
 * Overlay dialog with entry point trigger
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useA2UI } from '../../context';
import { registerComponent, renderChild, type A2UIComponentFn } from '../../renderer';
import type { A2UIComponentSpec } from '../../types';

export const Modal: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const [open, setOpen] = useState(false);
  const entry = spec.entryPointChild as A2UIComponentSpec;
  const content = spec.contentChild as A2UIComponentSpec;
  const title = spec.title as string | undefined;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  return (
    <>
      {/* Entry Point (trigger) */}
      <div onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        {renderChild(entry)}
      </div>

      {/* Modal Overlay */}
      {open &&
        createPortal(
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            {/* Modal Content */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: theme.colors.background,
                borderRadius: theme.borderRadius * 2,
                padding: theme.spacing(3),
                minWidth: 300,
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              {title && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing(2),
                  }}
                >
                  <h2 style={{ ...theme.typography.h3, margin: 0 }}>{title}</h2>
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: 20,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              {renderChild(content)}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

registerComponent('Modal', Modal);
