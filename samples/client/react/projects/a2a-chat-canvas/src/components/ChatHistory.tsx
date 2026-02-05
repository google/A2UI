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

import { useRef, useEffect } from "react";
import type React from "react";
import { useChatContext } from "../context/ChatContext";
import { Message } from "./Message";
import { MessageDecoratorProps } from "../types";

interface ChatHistoryProps {
  emptyContent?: React.ReactNode;
  messageDecorator?: React.ComponentType<MessageDecoratorProps>;
  className?: string;
}

/**
 * Chat history component that displays all messages.
 */
export function ChatHistory({
  emptyContent,
  messageDecorator,
  className,
}: ChatHistoryProps) {
  const { chat } = useChatContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chat.history]);

  if (chat.history.length === 0) {
    return (
      <div className={`chat-history empty ${className || ""}`}>
        {emptyContent || (
          <div className="empty-state">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`chat-history ${className || ""}`}>
      {chat.history.map((message) => (
        <Message
          key={message.id}
          message={message}
          decorator={messageDecorator}
        />
      ))}
    </div>
  );
}
