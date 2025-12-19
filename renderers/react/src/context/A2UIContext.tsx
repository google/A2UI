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

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { Data, Types } from "@a2ui/lit/0.8";
import type { A2UIActionEvent, SendActionCallback } from "../types/index.js";

interface A2UIContextValue {
  processor: Types.MessageProcessor;
  surfaces: ReadonlyMap<string, Types.Surface>;
  processMessages: (messages: Types.ServerToClientMessage[]) => void;
  sendAction: SendActionCallback;
  refresh: () => void;
}

const A2UIContext = createContext<A2UIContextValue | null>(null);

export interface A2UIProviderProps {
  children: ReactNode;
  onAction?: SendActionCallback;
}

export function A2UIProvider({ children, onAction }: A2UIProviderProps) {
  const [processor] = useState(
    () => new Data.A2uiMessageProcessor()
  );

  const [version, setVersion] = useState(0);

  const processMessages = useCallback(
    (messages: Types.ServerToClientMessage[]) => {
      processor.processMessages(messages);
      setVersion((v) => v + 1);
    },
    [processor]
  );

  const sendAction = useCallback(
    (action: A2UIActionEvent) => {
      onAction?.(action);
    },
    [onAction]
  );

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    (): A2UIContextValue => ({
      processor,
      surfaces: processor.getSurfaces(),
      processMessages,
      sendAction,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processor, processMessages, sendAction, refresh, version]
  );

  return (
    <A2UIContext.Provider value={value}>{children}</A2UIContext.Provider>
  );
}

export function useA2UIContext(): A2UIContextValue {
  const context = useContext(A2UIContext);
  if (!context) {
    throw new Error("useA2UIContext must be used within an A2UIProvider");
  }
  return context;
}
