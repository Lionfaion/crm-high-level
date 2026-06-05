import type { FastifyInstance } from "fastify";
import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: SocketServer | null = null;

export function initSocketIO(server: HttpServer, allowedOrigins: string[]) {
  io = new SocketServer(server, {
    cors: { origin: allowedOrigins, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    // Client sends auth token and joins account room
    socket.on("join:account", (accountId: string) => {
      socket.join(`account:${accountId}`);
    });

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

/** Emit new message to everyone in the conversation room */
export function emitMessage(conversationId: string, accountId: string, message: unknown) {
  io?.to(`conv:${conversationId}`).emit("message:new", message);
  io?.to(`account:${accountId}`).emit("inbox:update", { conversationId });
}

/** Emit typing indicator */
export function emitTyping(conversationId: string, userId: string) {
  io?.to(`conv:${conversationId}`).emit("typing", { userId });
}

export function getIO() {
  return io;
}
