"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import {
  createContext,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import { toast } from "@/components/chat/toast";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { Vote } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage, LoadedDataset } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

type ActiveChatContextValue = {
  chatId: string;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  isLoading: boolean;
  votes: Vote[] | undefined;
  currentModelId: string;
  setCurrentModelId: (id: string) => void;
  showCreditCardAlert: boolean;
  setShowCreditCardAlert: Dispatch<SetStateAction<boolean>>;
  activeDataset: LoadedDataset | null;
  setActiveDataset: Dispatch<SetStateAction<LoadedDataset | null>>;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);
const DATASET_STORAGE_PREFIX = "chat-dataset:";

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

function getDatasetStorageKey(chatId: string) {
  return `${DATASET_STORAGE_PREFIX}${chatId}`;
}

function readStoredDataset(chatId: string): LoadedDataset | null {
  try {
    const raw = window.localStorage.getItem(getDatasetStorageKey(chatId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as LoadedDataset;
    if (
      !parsed ||
      typeof parsed.name !== "string" ||
      typeof parsed.schema !== "string" ||
      !Array.isArray(parsed.records)
    ) {
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(getDatasetStorageKey(chatId));
    return null;
  }
}

function writeStoredDataset(chatId: string, dataset: LoadedDataset | null) {
  try {
    const key = getDatasetStorageKey(chatId);
    if (!dataset) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(dataset));
  } catch {
    console.warn("Unable to persist chat dataset.");
  }
}

function sameDataset(left: LoadedDataset | null, right: LoadedDataset | null) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.name === right.name &&
    left.schema === right.schema &&
    left.records.length === right.records.length
  );
}

async function persistDatasetToServer(
  chatId: string,
  dataset: LoadedDataset | null
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      {
        body: JSON.stringify({ id: chatId, dataset }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }
    );

    return response.ok;
  } catch {
    console.warn("Unable to persist chat dataset on the server.");
    return false;
  }
}

async function persistPendingDatasetToServer(
  chatId: string,
  pending: { dataset: LoadedDataset | null },
  pendingDatasetRef: MutableRefObject<{
    dataset: LoadedDataset | null;
  } | null>
) {
  const persisted = await persistDatasetToServer(chatId, pending.dataset);
  if (persisted && pendingDatasetRef.current === pending) {
    pendingDatasetRef.current = null;
  }
}

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();

  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(generateUUID());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = generateUUID();
  }
  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const [currentModelId, setCurrentModelId] = useState(DEFAULT_CHAT_MODEL);
  const currentModelIdRef = useRef(currentModelId);
  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const [input, setInput] = useState("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [activeDataset, setActiveDatasetState] = useState<LoadedDataset | null>(
    null
  );
  const activeDatasetRef = useRef(activeDataset);
  const chatIdRef = useRef(chatId);
  const chatExistsRef = useRef(!isNewChat);
  const pendingDatasetRef = useRef<{ dataset: LoadedDataset | null } | null>(
    null
  );

  useEffect(() => {
    chatIdRef.current = chatId;
    chatExistsRef.current = !isNewChat;
  }, [chatId, isNewChat]);

  const setActiveDataset = useCallback<
    Dispatch<SetStateAction<LoadedDataset | null>>
  >((value) => {
    setActiveDatasetState((previousDataset) => {
      const nextDataset =
        typeof value === "function" ? value(previousDataset) : value;
      const pendingDataset = { dataset: nextDataset };

      activeDatasetRef.current = nextDataset;
      pendingDatasetRef.current = pendingDataset;
      writeStoredDataset(chatIdRef.current, nextDataset);
      if (chatExistsRef.current) {
        persistPendingDatasetToServer(
          chatIdRef.current,
          pendingDataset,
          pendingDatasetRef
        );
      }

      return nextDataset;
    });
  }, []);

  const { data: chatData, isLoading } = useSWR(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!chatData || isNewChat) {
      return;
    }

    const serverDataset = chatData.dataset ?? null;
    const pendingDataset = pendingDatasetRef.current;

    if (pendingDataset) {
      if (sameDataset(pendingDataset.dataset, serverDataset)) {
        pendingDatasetRef.current = null;
      } else {
        if (chatExistsRef.current) {
          persistPendingDatasetToServer(
            chatId,
            pendingDataset,
            pendingDatasetRef
          );
        }
        return;
      }
    }

    activeDatasetRef.current = serverDataset;
    setActiveDatasetState(serverDataset);
    writeStoredDataset(chatId, serverDataset);
  }, [chatData, chatId, isNewChat]);

  useEffect(() => {
    if (!isNewChat) {
      return;
    }

    const storedDataset = readStoredDataset(chatId);
    activeDatasetRef.current = storedDataset;
    setActiveDatasetState(storedDataset);
  }, [chatId, isNewChat]);

  const initialMessages: ChatMessage[] = isNewChat
    ? []
    : (chatData?.messages ?? []);
  const visibility: VisibilityType = isNewChat
    ? "private"
    : (chatData?.visibility ?? "private");

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id: chatId,
    messages: initialMessages,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      return (
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const state = (part as { state?: string }).state;
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibility,
            dataset: activeDatasetRef.current,
            ...request.body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error.message?.includes("AI Gateway requires a valid credit card")) {
        setShowCreditCardAlert(true);
      } else if (error instanceof ChatbotError) {
        toast({ type: "error", description: error.message });
      } else {
        toast({
          type: "error",
          description: error.message || "Oops, an error occurred!",
        });
      }
    },
  });

  const loadedChatIds = useRef(new Set<string>());

  if (isNewChat && !loadedChatIds.current.has(newChatIdRef.current)) {
    loadedChatIds.current.add(newChatIdRef.current);
  }

  useEffect(() => {
    if (loadedChatIds.current.has(chatId)) {
      return;
    }
    if (chatData?.messages) {
      loadedChatIds.current.add(chatId);
      setMessages(chatData.messages);
    }
  }, [chatId, chatData?.messages, setMessages]);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      if (isNewChat) {
        setMessages([]);
      }
    }
  }, [chatId, isNewChat, setMessages]);

  useEffect(() => {
    if (chatData && !isNewChat) {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        setCurrentModelId(decodeURIComponent(cookieModel));
      }
    }
  }, [chatData, isNewChat]);

  const hasAppendedQueryRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    if (query && !hasAppendedQueryRef.current) {
      hasAppendedQueryRef.current = true;
      window.history.replaceState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });
    }
  }, [sendMessage, chatId]);

  useAutoResume({
    autoResume: !isNewChat && !!chatData,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isReadonly = isNewChat ? false : (chatData?.isReadonly ?? false);

  const { data: votes } = useSWR<Vote[]>(
    !isReadonly && messages.length >= 2
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const value = useMemo<ActiveChatContextValue>(
    () => ({
      chatId,
      messages,
      setMessages,
      sendMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      setInput,
      visibilityType: visibility,
      isReadonly,
      isLoading: !isNewChat && isLoading,
      votes,
      currentModelId,
      setCurrentModelId,
      showCreditCardAlert,
      setShowCreditCardAlert,
      activeDataset,
      setActiveDataset,
    }),
    [
      chatId,
      messages,
      setMessages,
      sendMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      visibility,
      isReadonly,
      isNewChat,
      isLoading,
      votes,
      currentModelId,
      showCreditCardAlert,
      activeDataset,
      setActiveDataset,
    ]
  );

  return (
    <ActiveChatContext.Provider value={value}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}
