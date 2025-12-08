import crypto from "crypto";
import { Invite } from "../models/invite.model.js";
import { User } from "../models/user.model.js";
import { sendInviteEmail } from "../services/email.services.js";

export const inviteUser = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    console.log("REQ BODY:", req.body);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await Invite.create({
      email,
      token,
      expiresAt,
      used: false,
    });

    await sendInviteEmail(email, token);

    return res.status(200).json({
      success: true,
      message: "Invite sent successfully",
    });
  } catch (error) {
    next(error);
  }
};
