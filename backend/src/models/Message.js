import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
    },
    userIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String,
    },
    isRecalled: {
      type: Boolean,
      default: false,
    },
    reactions: [reactionSchema],
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
