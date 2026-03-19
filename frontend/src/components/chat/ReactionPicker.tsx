import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const POPULAR_EMOJIS = ["👍", "❤️", "😂", "😭", "🙏", "😍", "😎", "🤩", "😡", "👏", "🔥", "✅", "❌"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ReactionPicker = ({ onSelect, isOpen, onClose, className }: ReactionPickerProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className={cn(
        "absolute top-full -mt-2 z-50 bg-background border rounded-full shadow-lg p-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200",
        className
      )}
    >
      {POPULAR_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent hover:scale-125 transition-transform duration-150 text-lg"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
