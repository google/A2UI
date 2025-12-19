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

import { A2UIProvider, ThemeProvider } from "@a2ui/react";
import { ChatProvider, useChatContext } from "../context/ChatContext";
import { Chat } from "./Chat";
import { Canvas } from "./Canvas";
import { A2aChatCanvasProps, A2AService } from "../types";
import "./A2aChatCanvas.css";

interface A2aChatCanvasInnerProps extends A2aChatCanvasProps {}

function A2aChatCanvasInner({
  emptyHistoryContent,
  messageDecorator,
  className,
}: A2aChatCanvasInnerProps) {
  const { canvas } = useChatContext();

  return (
    <div className={`a2a-chat-canvas ${className || ""}`}>
      <Chat
        emptyHistoryContent={emptyHistoryContent}
        messageDecorator={messageDecorator}
        className={canvas.isOpen ? "with-canvas" : ""}
      />
      <Canvas />
    </div>
  );
}

interface A2aChatCanvasWithUrlProps extends A2aChatCanvasProps {
  agentCardUrl: string;
  fetchImpl?: typeof fetch;
  service?: never;
}

interface A2aChatCanvasWithServiceProps extends A2aChatCanvasProps {
  service: A2AService;
  agentCardUrl?: never;
  fetchImpl?: never;
}

type A2aChatCanvasWithProviderProps = A2aChatCanvasWithUrlProps | A2aChatCanvasWithServiceProps;

export function A2aChatCanvas(props: A2aChatCanvasWithProviderProps) {
  const { emptyHistoryContent, messageDecorator, className } = props;
  const innerProps = { emptyHistoryContent, messageDecorator, className };

  if ("service" in props && props.service) {
    return (
      <ThemeProvider>
        <A2UIProvider>
          <ChatProvider service={props.service}>
            <A2aChatCanvasInner {...innerProps} />
          </ChatProvider>
        </A2UIProvider>
      </ThemeProvider>
    );
  }

  const urlProps = props as A2aChatCanvasWithUrlProps;
  return (
    <ThemeProvider>
      <A2UIProvider>
        <ChatProvider agentCardUrl={urlProps.agentCardUrl} fetchImpl={urlProps.fetchImpl}>
          <A2aChatCanvasInner {...innerProps} />
        </ChatProvider>
      </A2UIProvider>
    </ThemeProvider>
  );
}
