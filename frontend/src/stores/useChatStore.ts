import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import type { Conversation, SocketMessage } from "@/types/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (recipientId, content, imgUrl) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (conversationId, content, imgUrl) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },
      addMessage: async (message: SocketMessage) => {
        try {
          const { user } = useAuthStore.getState();

          const senderId = message.senderId || message.sender?._id;
          const isOwn = senderId === user?._id;
          const processedMessage: SocketMessage = { ...message, isOwn };

          const convoId = message.conversationId;

          set((state) => {
            const currentItems = state.messages[convoId]?.items ?? [];

            // Nếu message đã tồn tại, không làm gì
            if (currentItems.some((m) => m._id === processedMessage._id)) {
              return state;
            }

            // Thêm message mới vào (không fetch lại, message từ socket là realtime)
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...currentItems, processedMessage],
                  hasMore: state.messages[convoId]?.hasMore ?? true,
                  nextCursor: state.messages[convoId]?.nextCursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },
      updateConversation: (conversation: Partial<Conversation>) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === (conversation as Conversation)._id ? { ...c, ...conversation } : c
          ),
        }));
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                  ...c,
                  unreadCounts: {
                    ...c.unreadCounts,
                    [user._id]: 0,
                  },
                }
                : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },
      recallMessage: async (messageId) => {
        try {
          await chatService.recallMessage(messageId);
        } catch (error) {
          console.error("Lỗi xảy ra khi thu hồi tin nhắn trong store", error);
        }
      },
      updateRecalledMessage: (messageId, conversationId) => {
        set((state) => {
          const prevConvoMessages = state.messages[conversationId]?.items ?? [];
          const updatedItems = prevConvoMessages.map((m) =>
            m._id === messageId
              ? { ...m, isRecalled: true, content: "", imgUrl: "" }
              : m
          );

          const updatedConversations = state.conversations.map((c) => {
            if (
              c._id === conversationId &&
              c.lastMessage &&
              c.lastMessage._id === messageId
            ) {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  isRecalled: true,
                  content: "",
                },
              };
            }
            return c;
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: updatedItems,
              },
            },
            conversations: updatedConversations,
          };
        });
      },
      togglePinConversation: async (conversationId) => {
        try {
          const res = await chatService.pinConversation(conversationId);
          get().updateConversationPin(res.conversation);
        } catch (error) {
          console.error("Lỗi khi ghim/bỏ ghim cuộc hội thoại", error);
        }
      },
      updateConversationPin: (conversation) => {
        set((state) => {
          const updatedConversations = state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          );

          // Sắp xếp lại: pinned lên đầu
          updatedConversations.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.isPinned && b.isPinned) {
              return new Date(b.pinnedAt ?? 0).getTime() - new Date(a.pinnedAt ?? 0).getTime();
            }
            return new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();
          });

          return {
            conversations: updatedConversations,
          };
        });
      },
      // Reactions
      addReaction: async (messageId, emoji) => {
        try {
          const { activeConversationId } = get();
          if (!activeConversationId) return;

          await chatService.addReaction(messageId, emoji, activeConversationId);
        } catch (error) {
          console.error("Lỗi khi thêm reaction", error);
        }
      },
      updateReactions: (messageId, conversationId, reactions) => {
        set((state) => {
          const prevMessages = state.messages[conversationId]?.items ?? [];
          const updatedItems = prevMessages.map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          );

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: updatedItems,
              },
            },
          };
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
