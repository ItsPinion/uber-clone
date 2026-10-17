import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const standaloneRoot = join(process.cwd(), ".next", "standalone");
const assets = [
  [join(process.cwd(), ".next", "static"), join(standaloneRoot, ".next", "static")],
  [join(process.cwd(), "public"), join(standaloneRoot, "public")],
  [join(process.cwd(), "drizzle"), join(standaloneRoot, "drizzle")],
  [join(process.cwd(), "server.mjs"), join(standaloneRoot, "server.mjs")],
  [join(process.cwd(), "standalone-wrapper.mjs"), join(standaloneRoot, "standalone-wrapper.mjs")],
  [join(process.cwd(), "src", "lib", "server", "notification-realtime.mjs"), join(standaloneRoot, "src", "lib", "server", "notification-realtime.mjs")],
  [join(process.cwd(), "src", "lib", "server", "notification-websocket.mjs"), join(standaloneRoot, "src", "lib", "server", "notification-websocket.mjs")],
  [join(process.cwd(), "node_modules", "ws"), join(standaloneRoot, "node_modules", "ws")],
];

for (const [source, destination] of assets) {
  if (!existsSync(source)) continue;
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}
