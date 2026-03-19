import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  pinConversation,
  addReaction,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.patch("/:conversationId/pin", pinConversation);
router.post("/:conversationId/messages/:messageId/reaction", addReaction);

export default router;
