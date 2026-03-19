import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await api.put("/users/profile", data);
    return res.data;
  },
  changePassword: async (data: any) => {
    const res = await api.put("/users/change-password", data);
    return res.data;
  },
  /** Lấy thông tin profile user theo ID (để xem profile người khác) */
  getUserProfile: async (userId: string) => {
    const res = await api.get(`/users/${userId}/profile`);
    return res.data.user;
  },
};
