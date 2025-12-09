import nodemailer from "nodemailer";
import {
  FRONTEND_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendInviteEmail = async (email, token) => {
  const inviteUrl = `${FRONTEND_URL}/signup?inviteToken=${token}`;

  const htmlContent = `
    <h2>You have been invited!</h2>
    <p>Click the link below to accept your invite:</p>
    <a href="${inviteUrl}">Accept Invite</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await transporter.sendMail({
    to: email,
    from: EMAIL_FROM || SMTP_USER,
    subject: "You're invited!",
    html: htmlContent,
    text: `You have been invited! Accept your invite: ${inviteUrl}. This link will expire in 24 hours.`,
  });
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <h2>Password Reset Requested</h2>
    <p>Click the link below to reset your password. If you didn't request this, you can ignore this email.</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
  `;

  await transporter.sendMail({
    to: email,
    from: EMAIL_FROM || SMTP_USER,
    subject: "Reset your password",
    html: htmlContent,
    text: `Reset your password using this link: ${resetUrl}. The link expires in 1 hour.`,
  });
};
