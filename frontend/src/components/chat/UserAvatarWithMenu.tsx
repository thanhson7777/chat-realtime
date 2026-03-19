import { useState } from "react";
import UserAvatar from "./UserAvatar";
import ProfileModal from "./ProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";
import { userService } from "@/services/userService";
import { toast } from "sonner";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  bio?: string;
  phone?: string;
  createdAt?: string;
}

interface UserAvatarWithMenuProps {
  type: "sidebar" | "chat" | "profile";
  name: string;
  avatarUrl?: string;
  userData?: User | null;
  showMenu?: boolean;
}

const UserAvatarWithMenu = ({
  type,
  name,
  avatarUrl,
  userData,
  showMenu = true,
}: UserAvatarWithMenuProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenProfile = async () => {
    if (!userData?._id) return;
    setIsProfileOpen(true);
    setProfileUser(null);
    setLoading(true);
    try {
      const fullUser = await userService.getUserProfile(userData._id);
      setProfileUser(fullUser);
    } catch {
      toast.error("Không thể tải thông tin người dùng");
      setIsProfileOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
    setProfileUser(null);
  };

  if (!showMenu || !userData) {
    return (
      <UserAvatar
        type={type}
        name={name}
        avatarUrl={avatarUrl}
      />
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
            <UserAvatar
              type={type}
              name={name}
              avatarUrl={avatarUrl}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleOpenProfile}
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Xem Profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
        user={profileUser}
        loading={loading}
      />
    </>
  );
};

export default UserAvatarWithMenu;
