import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // ===== CONVERSATION EVENTS =====

    // Khi nhận được conversation mới (từ tin nhắn direct)
    socket.on("new-conversation", ({ conversation, message }) => {
      // Join room để nhận tin nhắn sau đó
      socket.emit("join-conversation", conversation._id);

      // Thêm conversation vào danh sách
      useChatStore.getState().addConvo(conversation);

      // Thêm message vào messages state nếu có
      if (message) {
        useChatStore.getState().addMessage(message);
      }
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // message recalled
    socket.on("message-recalled", ({ messageId, conversationId }) => {
      useChatStore.getState().updateRecalledMessage(messageId, conversationId);
    });

    // reaction updated
    socket.on("reaction-updated", ({ messageId, conversationId, reactions }) => {
      useChatStore.getState().updateReactions(messageId, conversationId, reactions);
    });

    // ===== FRIEND REQUEST EVENTS =====

    // Khi có lời mời kết bạn mới
    socket.on("friend-request-received", ({ request }) => {
      useFriendStore.getState().addReceivedRequest(request);
      toast.info(`Bạn có lời mời kết bạn từ ${request.from?.displayName || "người dùng"}`);
    });

    // Khi lời mời kết bạn được chấp nhận (người gửi nhận được)
    socket.on("friend-request-accepted", ({ friend }) => {
      useFriendStore.getState().addFriendRealtime(friend);
    });

    // Khi lời mời kết bạn được chấp nhận (người nhận tự động cập nhật)
    socket.on("friend-request-accepted-self", ({ friend }) => {
      useFriendStore.getState().addFriendRealtime(friend);
    });

    // Khi lời mời kết bạn bị từ chối (người gửi)
    socket.on("friend-request-rejected", ({ requestId }) => {
      useFriendStore.getState().removeSentRequest(requestId);
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
