import { useState } from "react";
import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatarWithMenu from "./UserAvatarWithMenu";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RotateCcw } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ReactionPicker from "./ReactionPicker";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
  const recallMessage = useChatStore((state) => state.recallMessage);
  const addReaction = useChatStore((state) => state.addReaction);
  const { user } = useAuthStore();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
    new Date(prev?.createdAt || 0).getTime() >
    300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );

  const handleRecall = () => {
    recallMessage(message._id);
  };

  const handleReaction = (emoji: string) => {
    addReaction(message._id, emoji);
    setShowReactionPicker(false);
  };

  return (
    <>
      {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1 mb-2">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce relative group mb-1.5",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* Message Actions: Chỉ cho tin nhắn của mình, bên trái */}
        {message.isOwn && !message.isRecalled && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-40">
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={handleRecall}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Thu hồi
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Avatar + Name (cho người khác) */}
        {!message.isOwn && (
          <div className="flex-shrink-0">
            {isGroupBreak ? (
              <UserAvatarWithMenu
                type="chat"
                name={participant?.displayName ?? "QuickChat"}
                avatarUrl={participant?.avatarUrl ?? undefined}
                userData={{
                  _id: participant?._id ?? "",
                  username: participant?.username ?? "",
                  email: participant?.email ?? "",
                  displayName: participant?.displayName ?? "",
                  avatarUrl: participant?.avatarUrl ?? undefined,
                }}
              />
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Name + Message bubble */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {/* Sender name (cho người khác, chỉ khi isGroupBreak) */}
          {!message.isOwn && isGroupBreak && (
            <span
              className="text-xs font-semibold px-1 truncate max-w-[150px] mb-0.5"
              style={{ color: "hsl(var(--primary))" }}
            >
              {participant?.displayName}
            </span>
          )}

          {/* Message bubble + Reaction button */}
          <div className="flex items-start gap-1.5">
            {message.isRecalled ? (
              <Card
                className={cn(
                  "px-4 py-2 border",
                  "bg-muted/50 text-muted-foreground"
                )}
              >
                <p className="text-sm italic">Tin nhắn đã được thu hồi</p>
              </Card>
            ) : (
              <>
                {message.imgUrl && (
                  <img
                    src={message.imgUrl}
                    alt="Message image"
                    className="max-w-[200px] md:max-w-[250px] rounded-xl object-contain shadow-sm border border-border/20"
                  />
                )}
                {message.content && (
                  <Card
                    className={cn(
                      "p-3",
                      message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
                    )}
                  >
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                  </Card>
                )}

                {/* Reaction button (+) cho tin nhắn người khác */}
                {!message.isOwn && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center self-center">
                    <div className="relative">
                      <button
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      >
                        <span className="text-lg">+</span>
                      </button>
                      <ReactionPicker
                        isOpen={showReactionPicker}
                        onClose={() => setShowReactionPicker(false)}
                        onSelect={handleReaction}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reactions display - bên dưới tin nhắn */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {message.reactions
                .filter((r) => r.userIds.length > 0)
                .map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleReaction(reaction.emoji)}
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                      reaction.userIds.includes(user?._id ?? "")
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span className={cn(
                      "font-medium",
                      reaction.userIds.includes(user?._id ?? "") ? "text-primary" : "text-muted-foreground"
                    )}>
                      {reaction.userIds.length}
                    </span>
                  </button>
                ))}
            </div>
          )}

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0 mt-0.5",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageItem;
