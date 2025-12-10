import express from "express";
import { PORT, NODE_ENV } from "./config/env.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import imageRoutes from "./routes/image.routes.js";
import inviteRoutes from "./routes/invite.routes.js";
import excelRoutes from "./routes/excel.routes.js";

import { protect } from "./middlewares/auth.middleware.js";

import { connectDB } from "./database/sequelize.js";
import { sequelize } from "./database/sequelize.js";

console.log(`Current Environment: ${NODE_ENV}`);

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use("/api/users", protect, userRoutes);

app.use("/api/images", imageRoutes);

app.use("/api/invites", inviteRoutes);

app.use("/api/excel", excelRoutes);

connectDB();

sequelize
  .sync({ alter: true })
  .then(() => console.log("Models synced"))
  .catch(console.error);

app.get("/", (req, res) => {
  res.send("Welcome to the Login System API ");
});

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

export default app;
