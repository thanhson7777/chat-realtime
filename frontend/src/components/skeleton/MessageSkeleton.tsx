import { cn } from "@/lib/utils";

interface MessageSkeletonProps {
  count?: number;
  className?: string;
}

const MessageSkeleton = ({ count = 1, className }: MessageSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2 mb-3 animate-pulse",
            i % 2 === 0 ? "justify-start" : "justify-end",
            className
          )}
        >
          {/* Avatar skeleton */}
          {i % 2 === 0 && (
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
          )}

          {/* Message bubble skeleton */}
          <div className="space-y-2">
            {/* Sender name skeleton (for received messages) */}
            {i % 2 === 0 && (
              <div className="h-3 w-20 bg-muted rounded" />
            )}

            {/* Bubble skeleton */}
            <div
              className={cn(
                "h-12 rounded-2xl bg-muted",
                i % 2 === 0 ? "w-48" : "w-36"
              )}
            />
          </div>
        </div>
      ))}
    </>
  );
};

export default MessageSkeleton;
