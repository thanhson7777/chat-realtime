import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatarWithMenu from "./UserAvatarWithMenu";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pin, PinOff, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages, togglePinConversation } =
    useChatStore();
  const { onlineUsers } = useSocketStore();

  if (!user) return null;

  const otherUser = convo.participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;

  const unreadCount = convo.unreadCounts[user._id];
  let lastMessage = convo.lastMessage?.content ?? "";

  if (convo.lastMessage?.isRecalled) {
    lastMessage = "Tin nhắn đã được thu hồi";
  }

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await togglePinConversation(convo._id);
      toast.success(convo.isPinned ? "Đã bỏ ghim cuộc hội thoại" : "Đã ghim cuộc hội thoại");
    } catch {
      toast.error("Không thể ghim/bỏ ghim cuộc hội thoại");
    }
  };

  return (
    <ChatCard
      convoId={convo._id}
      name={otherUser.displayName ?? ""}
      timestamp={
        convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      leftSection={
        <>
          <UserAvatarWithMenu
            type="sidebar"
            name={otherUser.displayName ?? ""}
            avatarUrl={otherUser.avatarUrl ?? undefined}
            userData={{
              _id: otherUser._id,
              username: otherUser.displayName ?? "",
              email: "",
              displayName: otherUser.displayName ?? "",
              avatarUrl: otherUser.avatarUrl ?? undefined,
            }}
          />
          <StatusBadge
            status={
              onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
            }
          />
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
        </>
      }
      subtitle={
        <p
          className={cn(
            "text-sm truncate",
            unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {lastMessage}
        </p>
      }
      rightSection={
        <div className="flex items-center gap-1">
          {convo.isPinned && (
            <Pin className="w-3.5 h-3.5 text-primary" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-full hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleTogglePin}
              >
                {convo.isPinned ? (
                  <>
                    <PinOff className="w-4 h-4 mr-2" />
                    Bỏ ghim
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-2" />
                    Ghim
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  );
};

export default DirectMessageCard;
