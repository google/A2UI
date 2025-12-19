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

import React, { useState, useCallback, useRef, KeyboardEvent } from "react";
import { useChatContext } from "../context/ChatContext";

interface InputAreaProps {
  className?: string;
}

/**
 * Input area component for the chat interface.
 */
export function InputArea({ className }: InputAreaProps) {
  const { chat } = useChatContext();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        chat.cancelStream();
        chat.sendMessage(trimmed);
        setValue("");
      }
    },
    [value, chat]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) {
          chat.cancelStream();
          chat.sendMessage(trimmed);
          setValue("");
        }
      }
    },
    [value, chat]
  );

  const handleCancel = useCallback(() => {
    chat.cancelStream();
    textareaRef.current?.focus();
  }, [chat]);

  return (
    <form className={`input-area ${className || ""}`} onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={chat.isLoading}
          className="chat-input"
        />
        {chat.isLoading ? (
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
            aria-label="Cancel"
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
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            className="send-button"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
