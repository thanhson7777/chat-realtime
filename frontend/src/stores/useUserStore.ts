import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        useChatStore.getState().fetchConversations();
      }
    } catch (error: any) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error(error.response?.data?.message || "Upload avatar không thành công!");
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await userService.updateProfile(data);
      const { user, setUser } = useAuthStore.getState();

      if (user && res.user) {
        setUser(res.user);
      }

      toast.success(res.message || "Cập nhật hồ sơ thành công!");
      return true;
    } catch (error: any) {
      console.error("Lỗi updateProfile", error);
      toast.error(error.response?.data?.message || "Cập nhật thất bại!");
      return false;
    }
  },

  changePassword: async (data) => {
    try {
      const res = await userService.changePassword(data);
      toast.success(res.message || "Đổi mật khẩu thành công!");
      return true;
    } catch (error: any) {
      console.error("Lỗi changePassword", error);
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại!");
      return false;
    }
  }
}));
