import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "node:http";
import mongoose from "mongoose";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server } from "socket.io";
import { Types } from "mongoose";
import authRouter from "./routes/auth.js";
import feedRouter from "./routes/feed.js";
import { ChatMessageModel } from "./models/Schemas.js";

dotenv.config();

const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGO_URI;
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
const isAllowedOrigin = (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
  const allowed = !origin || origin === frontendUrl || /^https:\/\/[-a-z0-9]+-3000\.app\.github\.dev$/i.test(origin);
  callback(null, allowed);
};
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: isAllowedOrigin },
});

type CanvasUpdate = {
  x: number;
  y: number;
  color: string;
};

async function configureRedisAdapter() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return;
  }

  const publisher = createClient({ url: redisUrl });
  const subscriber = publisher.duplicate();
  const handleRedisError = (error: unknown) => {
    console.error("Redis adapter error", error);
  };

  publisher.on("error", handleRedisError);
  subscriber.on("error", handleRedisError);
  await Promise.all([publisher.connect(), subscriber.connect()]);
  io.adapter(createAdapter(publisher, subscriber));
  console.log("Socket.IO Redis adapter enabled");
}

void configureRedisAdapter().catch((error: unknown) => {
  console.error("Redis adapter initialization failed", error);
});

app.use(cors({ origin: isAllowedOrigin }));
app.use(express.json());
app.use("/api/posts", feedRouter);
app.use("/api/auth", authRouter);

app.get("/api/rooms/:roomId/messages", async (request, response) => {
  try {
    const messages = await ChatMessageModel.find({ roomId: request.params.roomId })
      .select("roomId sender messageText timestamp")
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();
    response.json(messages);
  } catch (error: unknown) {
    console.error("Failed to load room messages", error);
    response.status(500).json({ error: "Failed to load room messages" });
  }
});

app.get("/", (_request, response) => {
  response.json({
    name: "Pulse Hub API",
    status: "ok",
    health: "/health",
  });
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

if (!mongoUri) {
  console.error("MONGO_URI is not configured");
} else {
  mongoose.connect(mongoUri).catch((error: unknown) => {
    console.error("MongoDB connection failed", error);
  });
}

io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on("join_room", (roomId: string) => {
    if (!roomId?.trim()) return;
    socket.join(roomId);
  });

  socket.on("send_msg", async (
    roomId: string,
    senderId: string,
    messageText: string,
  ) => {
      if (!roomId?.trim() || !Types.ObjectId.isValid(senderId) || !messageText?.trim()) {
        socket.emit("error", "A valid room, sender, and message are required");
        return;
      }

      try {
        const message = await ChatMessageModel.create({
          roomId,
          sender: senderId,
          messageText: messageText.trim(),
        });

        io.to(roomId).emit("receive_msg", {
          roomId,
          sender: senderId,
          messageText: message.messageText,
          timestamp: message.timestamp,
        });
      } catch (error: unknown) {
        console.error("Failed to save message", error);
        socket.emit("error", "Failed to save message");
      }
  });

  socket.on("canvas_update", (roomId: string, update: CanvasUpdate) => {
    if (!roomId || !Number.isFinite(update?.x) || !Number.isFinite(update?.y) || typeof update.color !== "string") {
      return;
    }

    socket.to(roomId).emit("canvas_update", update);
  });

  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Pulse Hub server engine listening on http://localhost:${port}`);
});