import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
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
          "flex gap-2 message-bounce relative group mb-1.5", // hover group & space between
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "QuickChat"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* Message Actions (only for own non-recalled messages) */}
        {message.isOwn && !message.isRecalled && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {message.isRecalled ? (
            <Card
              className={cn(
                "px-4 py-2 border",
                message.isOwn ? "bg-muted/50 text-muted-foreground" : "bg-muted/50 text-muted-foreground"
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
                  className="max-w-[200px] md:max-w-[250px] rounded-xl object-contain shadow-sm border border-border/20 mb-1"
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
            </>
          )}

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0 mt-1",
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
