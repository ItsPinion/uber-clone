import assert from "node:assert/strict";
import { test } from "node:test";
import { isDriverUser } from "../src/lib/server/driver-access";

test("driver access uses an explicit comma- or whitespace-separated Clerk ID allow-list", () => {
  const original = process.env.CABBOOK_DRIVER_USER_IDS;
  process.env.CABBOOK_DRIVER_USER_IDS = "driver-one, driver-two\ndriver-three";
  try {
    assert.equal(isDriverUser("driver-one"), true);
    assert.equal(isDriverUser("driver-two"), true);
    assert.equal(isDriverUser("driver-three"), true);
    assert.equal(isDriverUser("rider-one"), false);
    process.env.CABBOOK_DRIVER_USER_IDS = "";
    assert.equal(isDriverUser("driver-one"), false);
  } finally {
    if (original === undefined) delete process.env.CABBOOK_DRIVER_USER_IDS;
    else process.env.CABBOOK_DRIVER_USER_IDS = original;
  }
});
