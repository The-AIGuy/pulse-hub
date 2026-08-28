import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: frontendUrl }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

const io = new Server(httpServer, {
  cors: { origin: frontendUrl },
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => undefined);
});

httpServer.listen(port, () => {
  console.log(`Pulse Hub backend listening on http://localhost:${port}`);
});