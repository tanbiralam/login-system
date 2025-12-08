import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export const socketAuth = (socket, next) => {
  let token = socket.handshake.auth?.token;

  if (!token) {
    token = socket.handshake.headers.authorization?.split(" ")[1];
  }

  if (!token) return next(new Error("No token"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};
