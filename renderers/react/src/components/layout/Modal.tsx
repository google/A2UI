/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import React, { useState, useMemo, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { Types } from "@a2ui/lit/0.8";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

interface ModalProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Modal" };
  renderChild?: (node: Types.AnyComponentNode) => ReactNode;
}

export function Modal({ node, renderChild }: ModalProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const properties = node.properties as {
    entryPointChild?: Types.AnyComponentNode;
    contentChild?: Types.AnyComponentNode;
  };

  const entryPointChild = properties.entryPointChild;
  const contentChild = properties.contentChild;

  const backdropClasses = useMemo(() => {
    return classMapToString(theme.components.Modal.backdrop);
  }, [theme]);

  const elementClasses = useMemo(() => {
    return classMapToString(theme.components.Modal.element);
  }, [theme]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  return (
    <>
      {entryPointChild && renderChild && (
        <div onClick={handleOpen} className="cursor-pointer">
          {renderChild(entryPointChild)}
        </div>
      )}

      {isOpen && (
        <>
          <div
            className={cn(backdropClasses)}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            className={cn(elementClasses)}
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mt-4">
              {contentChild && renderChild ? renderChild(contentChild) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
