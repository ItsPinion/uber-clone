import http from "node:http";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { attachNotificationWebSocket } from "./src/lib/server/notification-websocket.mjs";

// Next's generated standalone server creates its HTTP server through node:http.
// Attach the authenticated WebSocket transport to that same server before it listens.
const originalCreateServer = http.createServer;
http.createServer = function (...args) {
  const server = originalCreateServer.apply(this, args);
  attachNotificationWebSocket(server);
  return server;
};

process.env.HOSTNAME = process.env.HOST || "0.0.0.0";
const generatedServer = existsSync(resolve(".next/standalone/server.js"))
  ? resolve(".next/standalone/server.js")
  : resolve("server.js");
await import(pathToFileURL(generatedServer).href);
