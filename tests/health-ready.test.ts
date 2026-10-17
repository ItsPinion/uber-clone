import assert from "node:assert/strict";
import { test } from "node:test";
import { createReadinessResponse } from "../src/app/api/health/ready/route";

process.env.CABBOOK_DATABASE_PATH = `${process.cwd()}/README.md/unavailable.sqlite`;

test("readiness returns a generic uncached 503 when SQLite cannot initialize", async () => {
  const response = createReadinessResponse();

  assert.equal(response.status, 503);
  assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
  assert.deepEqual(await response.json(), { status: "not_ready" });
});

test("readiness reports an uncached success after the SQLite schema is available", async () => {
  process.env.CABBOOK_DATABASE_PATH = ":memory:";
  const response = createReadinessResponse();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
  assert.deepEqual(await response.json(), { status: "ok" });
});
