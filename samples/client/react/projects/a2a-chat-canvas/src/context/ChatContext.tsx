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

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { useA2UI } from "@a2ui/react";
import { Types } from "@a2ui/lit/0.8";
import { A2AClient } from "@a2a-js/sdk/client";
import {
  MessageSendParams,
  SendMessageSuccessResponse,
  Task,
  AgentCard,
  Part,
} from "@a2a-js/sdk";
import { v4 as uuid } from "uuid";
import {
  UiMessage,
  UiMessageContent,
  UiAgent,
  ChatServiceState,
  CanvasServiceState,
  A2AService,
} from "../types";
import {
  extractA2aPartsFromResponse,
  extractA2uiDataParts,
  convertPartToUiMessageContent,
} from "../utils";

interface ChatContextValue {
  chat: ChatServiceState;
  canvas: CanvasServiceState;
  agentCard: { name: string; iconUrl?: string } | null;
  a2uiSurfaces: ReadonlyMap<string, Types.Surface>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderPropsWithUrl {
  children: ReactNode;
  agentCardUrl: string;
  fetchImpl?: typeof fetch;
  service?: never;
}

interface ChatProviderPropsWithService {
  children: ReactNode;
  service: A2AService;
  agentCardUrl?: never;
  fetchImpl?: never;
}

type ChatProviderProps = ChatProviderPropsWithUrl | ChatProviderPropsWithService;

export function ChatProvider(props: ChatProviderProps) {
  const { children, service } = props;
  const agentCardUrl = "agentCardUrl" in props ? props.agentCardUrl : undefined;
  const fetchImpl = "fetchImpl" in props ? props.fetchImpl : undefined;

  const { surfaces, processMessages, clearSurfaces } = useA2UI();
  const [history, setHistory] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentCard, setAgentCard] = useState<{ name: string; iconUrl?: string } | null>(null);
  const [canvasSurfaceId, setCanvasSurfaceId] = useState<string | null>(null);

  const clientRef = useRef<A2AClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const customFetch = useCallback(
    async (url: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set(
        "X-A2A-Extensions",
        "https://a2ui.org/a2a-extension/a2ui/v0.8"
      );
      const newInit = { ...init, headers };
      return (fetchImpl || fetch)(url, newInit);
    },
    [fetchImpl]
  );

  const getClient = useCallback(async () => {
    if (!clientRef.current && agentCardUrl) {
      clientRef.current = await A2AClient.fromCardUrl(agentCardUrl, {
        fetchImpl: customFetch,
      });

      try {
        const card = await clientRef.current.getAgentCard();
        setAgentCard(card);
      } catch (e) {
        console.error("Failed to fetch agent card:", e);
      }
    }
    return clientRef.current;
  }, [agentCardUrl, customFetch]);

  useEffect(() => {
    if (service) {
      service.getAgentCard().then(setAgentCard).catch(console.error);
    }
  }, [service]);

  const createUserMessage = useCallback(
    (text: string, timestamp: string): UiMessage => ({
      type: "ui_message",
      id: uuid(),
      contextId: "",
      role: { type: "ui_user" },
      contents: [
        {
          type: "ui_message_content",
          id: uuid(),
          data: { kind: "text", text },
          variant: "default_text_part",
        },
      ],
      status: "completed",
      created: timestamp,
      lastUpdated: timestamp,
    }),
    []
  );

  const createPendingAgentMessage = useCallback(
    (timestamp: string): UiMessage => ({
      type: "ui_message",
      id: uuid(),
      contextId: "",
      role: {
        type: "ui_agent",
        name: agentCard?.name || "Agent",
        iconUrl: agentCard?.iconUrl,
      },
      contents: [],
      status: "pending",
      created: timestamp,
      lastUpdated: timestamp,
    }),
    [agentCard]
  );

  const sendMessageWithClient = useCallback(
    async (text: string) => {
      const client = await getClient();
      if (!client) throw new Error("A2A client not available");

      const sendParams: MessageSendParams = {
        message: {
          messageId: uuid(),
          role: "user",
          parts: [{ kind: "text", text }],
          kind: "message",
        },
      };

      const response = await client.sendMessage(sendParams);

      if ("error" in response) {
        throw new Error(response.error.message);
      }

      const parts = extractA2aPartsFromResponse(response as SendMessageSuccessResponse);
      const result = (response as SendMessageSuccessResponse).result as Task;
      const subagentCard = result.metadata?.["a2a_subagent"] as AgentCard | undefined;

      return { parts, subagentName: subagentCard?.name };
    },
    [getClient]
  );

  const sendMessageWithService = useCallback(
    async (text: string) => {
      if (!service) throw new Error("A2A service not available");

      const response = await service.sendMessage(text);
      return { parts: response.parts, subagentName: response.subagentCard?.name };
    },
    [service]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const timestamp = new Date().toISOString();

      const userMessage = createUserMessage(text, timestamp);
      const pendingMessage = createPendingAgentMessage(timestamp);
      setHistory((prev) => [...prev, userMessage, pendingMessage]);
      setIsLoading(true);

      try {
        abortControllerRef.current = new AbortController();

        const { parts, subagentName } = service
          ? await sendMessageWithService(text)
          : await sendMessageWithClient(text);

        const contents = parts.map(convertPartToUiMessageContent);

        setHistory((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          const agentRole = updated[lastIdx].role as UiAgent;

          updated[lastIdx] = {
            ...updated[lastIdx],
            role: {
              ...agentRole,
              subagentName,
            },
            contents,
            status: "completed",
            lastUpdated: new Date().toISOString(),
          };
          return updated;
        });

        const a2uiMessages = extractA2uiDataParts(parts as Part[]);
        if (a2uiMessages.length > 0) {
          clearSurfaces();
          processMessages(a2uiMessages);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.name === "AbortError"
            ? "You cancelled the response."
            : `Something went wrong: ${error}`;

        const errorContent: UiMessageContent = {
          type: "ui_message_content",
          id: uuid(),
          data: { kind: "text", text: errorMessage },
          variant: "default_text_part",
        };

        setHistory((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            contents: [errorContent],
            status: "error",
            lastUpdated: new Date().toISOString(),
          };
          return updated;
        });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      service,
      createUserMessage,
      createPendingAgentMessage,
      sendMessageWithClient,
      sendMessageWithService,
      clearSurfaces,
      processMessages,
    ]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const openCanvas = useCallback((surfaceId: string) => {
    setCanvasSurfaceId(surfaceId);
  }, []);

  const closeCanvas = useCallback(() => {
    setCanvasSurfaceId(null);
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      chat: {
        history,
        isLoading,
        sendMessage,
        cancelStream,
      },
      canvas: {
        surfaceId: canvasSurfaceId,
        isOpen: !!canvasSurfaceId,
        openCanvas,
        closeCanvas,
      },
      agentCard,
      a2uiSurfaces: surfaces,
    }),
    [
      history,
      isLoading,
      sendMessage,
      cancelStream,
      canvasSurfaceId,
      openCanvas,
      closeCanvas,
      agentCard,
      surfaces,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
