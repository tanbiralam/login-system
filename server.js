import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/index.js";
import { PORT } from "./config/env.js";
import "./workers/index.js";

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
