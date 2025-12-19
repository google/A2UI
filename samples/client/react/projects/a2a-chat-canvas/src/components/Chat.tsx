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

import React from "react";
import { ChatHistory } from "./ChatHistory";
import { InputArea } from "./InputArea";
import { MessageDecoratorProps } from "../types";

interface ChatProps {
  emptyHistoryContent?: React.ReactNode;
  messageDecorator?: React.ComponentType<MessageDecoratorProps>;
  className?: string;
}

/**
 * Chat component that combines the chat history and input area.
 */
export function Chat({
  emptyHistoryContent,
  messageDecorator,
  className,
}: ChatProps) {
  return (
    <div className={`chat ${className || ""}`}>
      <ChatHistory
        emptyContent={emptyHistoryContent}
        messageDecorator={messageDecorator}
        className="chat-history-container"
      />
      <InputArea className="chat-input-container" />
    </div>
  );
}
