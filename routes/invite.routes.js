import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  acceptInvite,
  getInviteByToken,
  inviteUser,
} from "../controllers/invite.controller.js";

const router = express.Router();

router.post("/", protect, inviteUser);
router.get("/:token", getInviteByToken);
router.post("/accept", acceptInvite);

export default router;
