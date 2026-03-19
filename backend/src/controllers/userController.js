import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl"
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true,
      }
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, bio, phone } = req.body;
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (phone !== undefined) updates.phone = phone;
    // For simplicity, skip username/email or add logic:
    if (req.body.username) {
      const existing = await User.findOne({ username: req.body.username });
      if (existing && existing._id.toString() !== userId.toString()) return res.status(400).json({ message: "Username đã tồn tại" });
      updates.username = req.body.username;
    }
    if (req.body.email) {
      const existing = await User.findOne({ email: req.body.email });
      if (existing && existing._id.toString() !== userId.toString()) return res.status(400).json({ message: "Email đã tồn tại" });
      updates.email = req.body.email;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-hashedPassword");
    return res.status(200).json({ user: updatedUser, message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi khi update profile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.hashedPassword = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/** Lấy thông tin profile của user theo ID (cho xem profile người khác) */
export const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "_id username email displayName avatarUrl bio phone createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi lấy profile theo ID", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
