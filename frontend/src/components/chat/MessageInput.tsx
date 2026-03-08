import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { chatService } from "@/services/chatService";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const [value, setValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một file hình ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh không được vượt quá 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!value.trim() && !imageFile) return;
    
    setIsSending(true);
    let imgUrl;
    
    try {
      if (imageFile) {
        const uploadRes = await chatService.uploadImage(imageFile);
        imgUrl = uploadRes.imgUrl;
      }

      const currValue = value;
      setValue("");
      removeImage();

      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user._id);
        if (otherUser) {
          await sendDirectMessage(otherUser._id, currValue, imgUrl);
        }
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, imgUrl);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-zinc-100/80 dark:bg-zinc-950/80 backdrop-blur-md border-t">
      {preview && (
        <div className="px-4 pt-3 flex items-start">
          <div className="relative inline-block mt-2">
            <img 
              src={preview} 
              alt="Preview" 
              className="h-20 max-w-[200px] object-cover rounded-lg border border-border/50 shadow-sm" 
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="hover:bg-primary/10 transition-smooth"
        >
          <ImagePlus className="size-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            onKeyDown={handleKeyPress}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Soạn tin nhắn..."
            className="pr-20 h-9 bg-zinc-100 dark:bg-zinc-900 border-border/50 focus:border-primary/50 transition-smooth resize-none"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setValue((prev) => `${prev}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        <Button
          onClick={sendMessage}
          disabled={(!value.trim() && !imageFile) || isSending}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
