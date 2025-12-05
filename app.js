import express from "express";
import cookieParser from "cookie-parser";
import { PORT, NODE_ENV } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import imageRoutes from "./routes/image.routes.js";

import { protect } from "./middlewares/auth.middleware.js";

import { connectDB } from "./database/sequelize.js";
import { sequelize } from "./database/sequelize.js";

console.log(`Current Environment: ${NODE_ENV}`);

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use("/api/users", protect, userRoutes);

app.use("/api/images", imageRoutes);

connectDB();

sequelize
  .sync({ alter: true })
  .then(() => console.log("Models synced"))
  .catch(console.error);

app.get("/", (req, res) => {
  res.send("Welcome to the Login System API ");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
