import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { inviteUser } from "../controllers/invite.controller.js";

const router = express.Router();

router.post("/", protect, inviteUser);

export default router;
