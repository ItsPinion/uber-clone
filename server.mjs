import { createServer } from "node:http";
import next from "next";
import { attachNotificationWebSocket } from "./src/lib/server/notification-websocket.mjs";

const dev = process.argv.includes("dev");
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((request, response) => handle(request, response));
const notificationSocket = attachNotificationWebSocket(server);

server.listen(port, hostname, () => {
  console.log(`> CabBook ${dev ? "development" : "production"} server listening on http://${hostname}:${port}`);
});

function shutdown() {
  notificationSocket.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
