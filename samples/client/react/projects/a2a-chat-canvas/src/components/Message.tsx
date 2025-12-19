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
import { UiMessage, UiAgent, MessageDecoratorProps } from "../types";
import { formatTimestamp } from "../utils";
import { useChatContext } from "../context/ChatContext";

interface MessageProps {
  message: UiMessage;
  decorator?: React.ComponentType<MessageDecoratorProps>;
}

/**
 * Message component that displays a single chat message.
 */
export function Message({ message, decorator: Decorator }: MessageProps) {
  const { a2uiSurfaces } = useChatContext();
  const isUser = message.role.type === "ui_user";
  const isAgent = message.role.type === "ui_agent";
  const agentRole = isAgent ? (message.role as UiAgent) : null;

  const content = (
    <div className={`message ${isUser ? "user-message" : "agent-message"}`}>
      <div className="message-avatar">
        {isAgent && agentRole?.iconUrl ? (
          <img src={agentRole.iconUrl} alt={agentRole.name} />
        ) : isAgent ? (
          <div className="agent-avatar">{agentRole?.name?.charAt(0) || "A"}</div>
        ) : (
          <div className="user-avatar">U</div>
        )}
      </div>

      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">
            {isAgent ? agentRole?.name : "You"}
            {agentRole?.subagentName && (
              <span className="subagent-name"> via {agentRole.subagentName}</span>
            )}
          </span>
          <span className="message-time">{formatTimestamp(message.created)}</span>
        </div>

        <div className="message-body">
          {message.status === "pending" && message.contents.length === 0 ? (
            <div className="loading-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          ) : (
            message.contents.map((content) => (
              <MessageContent
                key={content.id}
                content={content}
                surfaceIds={Array.from(a2uiSurfaces.keys())}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (Decorator) {
    return <Decorator message={message}>{content}</Decorator>;
  }

  return content;
}

interface MessageContentProps {
  content: UiMessage["contents"][0];
  surfaceIds: string[];
}

function MessageContent({ content, surfaceIds }: MessageContentProps) {
  if (content.data.kind === "text") {
    return <p className="text-content">{content.data.text}</p>;
  }

  if (content.variant === "a2ui_data_part") {
    return (
      <div className="a2ui-content">
        {surfaceIds.map((surfaceId) => (
          <A2UIRenderer
            key={surfaceId}
            surfaceId={surfaceId}
            className="embedded-surface"
          />
        ))}
      </div>
    );
  }

  return <pre className="json-content">{JSON.stringify(content.data, null, 2)}</pre>;
}
