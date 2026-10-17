import { WebSocketServer } from "ws";
import { consumeNotificationSocketTicket, subscribeNotificationEvents } from "./notification-realtime.mjs";

function originMatchesRequest(request) {
  const origin = request.headers.origin;
  const requestHost = request.headers.host;
  if (typeof origin !== "string" || typeof requestHost !== "string") return false;
  try {
    const originUrl = new URL(origin);
    return (originUrl.protocol === "https:" || originUrl.protocol === "http:")
      && originUrl.host === requestHost;
  } catch {
    return false;
  }
}

function reject(socket, status, message) {
  socket.end(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

export function attachNotificationWebSocket(server) {
  const webSockets = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  const clientsByUser = new Map();
  const onUpgrade = (request, socket, head) => {
    let url;
    try { url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`); }
    catch { return; }
    if (url.pathname !== "/api/notifications/socket") return;
    if (!originMatchesRequest(request)) return reject(socket, 403, "Forbidden");
    const userId = consumeNotificationSocketTicket(url.searchParams.get("ticket"));
    if (!userId) return reject(socket, 401, "Unauthorized");
    webSockets.handleUpgrade(request, socket, head, (client) => {
      webSockets.emit("connection", client, request, userId);
    });
  };
  const originalOn = server.on;
  server.on = function (event, listener) {
    if (event !== "upgrade" || listener === onUpgrade) return originalOn.call(this, event, listener);
    const nextListener = function (request, socket, head) {
      try {
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
        if (url.pathname === "/api/notifications/socket") return;
      } catch { return; }
      return listener.call(this, request, socket, head);
    };
    return originalOn.call(this, event, nextListener);
  };
  server.on("upgrade", onUpgrade);

  webSockets.on("connection", (client, _request, userId) => {
    const userClients = clientsByUser.get(userId) ?? new Set();
    userClients.add(client);
    clientsByUser.set(userId, userClients);
    client.send(JSON.stringify({ type: "ready" }));
    client.on("message", () => client.close(1008, "Notification sockets are read-only"));
    client.on("close", () => {
      userClients.delete(client);
      if (userClients.size === 0) clientsByUser.delete(userId);
    });
  });

  const unsubscribe = subscribeNotificationEvents((notification) => {
    const clients = clientsByUser.get(notification.userId);
    if (!clients?.size) return;
    const message = JSON.stringify({ type: "notification", notification: notification.data });
    for (const client of clients) if (client.readyState === 1) client.send(message);
  });

  return {
    close() {
      unsubscribe();
      server.off("upgrade", onUpgrade);
      server.on = originalOn;
      for (const client of webSockets.clients) client.close(1001, "Server shutting down");
      webSockets.close();
    },
  };
}
