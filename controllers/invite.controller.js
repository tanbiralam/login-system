import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Invite } from "../models/invite.model.js";
import { User } from "../models/user.model.js";
import { sendInviteEmail } from "../services/email.services.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

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

export const getInviteByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await Invite.findOne({ where: { token } });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invite is invalid or expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: { email: invite.email },
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req, res, next) => {
  try {
    const { token, password, name } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required",
      });
    }

    const invite = await Invite.findOne({ where: { token } });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invite is invalid or expired",
      });
    }

    const existingUser = await User.findOne({ where: { email: invite.email } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Invite already used for an existing account",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const derivedName =
      name || invite.email.split("@")[0] || "Invited User";

    const newUser = await User.create({
      email: invite.email,
      name: derivedName,
      password: hashedPassword,
    });

    invite.used = true;
    await invite.save();

    const authToken = jwt.sign({ id: newUser.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      success: true,
      message: "Invite accepted. Account created.",
      token: authToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
