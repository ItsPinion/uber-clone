import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const standaloneRoot = join(process.cwd(), ".next", "standalone");
const assets = [
  [join(process.cwd(), ".next", "static"), join(standaloneRoot, ".next", "static")],
  [join(process.cwd(), "public"), join(standaloneRoot, "public")],
  [join(process.cwd(), "drizzle"), join(standaloneRoot, "drizzle")],
];

for (const [source, destination] of assets) {
  if (!existsSync(source)) continue;
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}
