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

import { A2UIRenderer } from "@a2ui/react";
import { useChatContext } from "../context/ChatContext";

interface CanvasProps {
  className?: string;
}

/**
 * Canvas component that displays A2UI surfaces in a side panel.
 */
export function Canvas({ className }: CanvasProps) {
  const { canvas } = useChatContext();

  if (!canvas.isOpen || !canvas.surfaceId) {
    return null;
  }

  return (
    <div className={`canvas ${className || ""}`}>
      <div className="canvas-header">
        <button
          className="close-button"
          onClick={canvas.closeCanvas}
          aria-label="Close canvas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
      <div className="canvas-content">
        <A2UIRenderer surfaceId={canvas.surfaceId} className="canvas-surface" />
      </div>
    </div>
  );
}
