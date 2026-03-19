import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Mail, Phone, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  _id: string;
  username: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  loading?: boolean;
}

const ProfileModal = ({ isOpen, onClose, user, loading = false }: ProfileModalProps) => {
  const createdDate = user?.createdAt
    ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })
    : "Không xác định";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="sr-only">Thông tin cá nhân</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Skeleton className="size-24 rounded-full" />
            <div className="space-y-2 w-full max-w-[200px]">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
            <div className="w-full space-y-3 mt-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        ) : user ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <UserAvatar
              type="profile"
              name={user.displayName}
              avatarUrl={user.avatarUrl}
            />

            <div className="text-center">
              <h2 className="text-xl font-bold">{user.displayName}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            <Badge variant="secondary" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Thành viên từ {createdDate}
            </Badge>

            {user.bio && (
              <div className="w-full text-center">
                <p className="text-sm text-muted-foreground">{user.bio}</p>
              </div>
            )}

            <div className="w-full space-y-3 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground">Email</div>
                  <div className="text-sm truncate">
                    {user.email || "Chưa cập nhật"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground">Điện thoại</div>
                  <div className="text-sm">{user.phone || "Chưa cập nhật"}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
