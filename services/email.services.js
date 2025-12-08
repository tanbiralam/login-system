import { Resend } from "resend";
import { RESEND_API_KEY, FRONTEND_URL } from "../config/env.js";

const resend = new Resend(RESEND_API_KEY);

export const sendInviteEmail = async (email, token) => {
  const inviteUrl = `${FRONTEND_URL}/signup?inviteToken=${token}`;

  const htmlContent = `
    <h2>You have been invited!</h2>
    <p>Click the link below to accept your invite:</p>
    <a href="${inviteUrl}">Accept Invite</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await resend.emails.send({
    from: "itzmetanbir@gmail.com",
    to: email,
    subject: "You're invited!",
    html: htmlContent,
  });
};
