import { useState } from "react";
import { createReactComponent } from "../../adapter";
import { ModalApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const ReactModal = createReactComponent(
  ModalApi,
  ({ props, buildChild }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <div onClick={() => setIsOpen(true)} style={{ display: 'inline-block' }}>
          {props.trigger ? buildChild(props.trigger) : null}
        </div>
        {isOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setIsOpen(false)}
          >
            <div 
              style={{
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                maxWidth: '90%',
                maxHeight: '90%',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
              {props.content ? buildChild(props.content) : null}
            </div>
          </div>
        )}
      </>
    );
  }
);
