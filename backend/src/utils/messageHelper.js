export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

const formatConversation = (conversation) => {
  const participants = (conversation.participants || []).map((p) => ({
    _id: p.userId?._id?.toString() || p.userId?.toString(),
    displayName: p.userId?.displayName,
    username: p.userId?.username,
    email: p.userId?.email,
    avatarUrl: p.userId?.avatarUrl ?? null,
    joinedAt: p.joinedAt,
  }));

  const lastMessage = conversation.lastMessage
    ? {
        _id: conversation.lastMessage._id?.toString() || conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: conversation.lastMessage.senderId
          ? {
              _id: conversation.lastMessage.senderId._id?.toString() || conversation.lastMessage.senderId?.toString(),
              displayName: conversation.lastMessage.senderId?.displayName,
              avatarUrl: conversation.lastMessage.senderId?.avatarUrl ?? null,
            }
          : null,
      }
    : null;

  return {
    _id: conversation._id.toString(),
    type: conversation.type,
    group: conversation.group || null,
    participants,
    lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    seenBy: conversation.seenBy || [],
    unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
    isPinned: conversation.isPinned || false,
    pinnedAt: conversation.pinnedAt || null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

export const emitNewMessage = (io, conversation, message) => {
  const senderId = message.senderId.toString();
  const participantIds = conversation.participants.map((p) => {
    const userId = p.userId?._id || p.userId;
    return userId.toString();
  });
  const recipientIds = participantIds.filter((id) => id !== senderId);

  const messageWithSender = {
    ...message.toObject(),
    sender: {
      _id: message.senderId,
    },
  };

  const formattedConversation = formatConversation(conversation);

  const conversationUpdate = {
    _id: formattedConversation._id,
    lastMessage: formattedConversation.lastMessage,
    lastMessageAt: formattedConversation.lastMessageAt,
    unreadCounts: formattedConversation.unreadCounts,
  };

  // Emit cho recipient riêng (để họ nhận ngay cả khi chưa join room)
  recipientIds.forEach((recipientId) => {
    io.to(recipientId).emit("new-message", {
      message: messageWithSender,
      conversation: conversationUpdate,
      unreadCounts: conversationUpdate.unreadCounts,
    });
  });

  // Emit new-conversation cho recipient để join room và thêm vào danh sách
  recipientIds.forEach((recipientId) => {
    io.to(recipientId).emit("new-conversation", {
      conversation: formattedConversation,
      message: messageWithSender,
    });
  });

  // Emit cho conversation room (sender sẽ nhận để update UI)
  io.to(conversation._id.toString()).emit("new-message", {
    message: messageWithSender,
    conversation: conversationUpdate,
    unreadCounts: conversationUpdate.unreadCounts,
  });
};
