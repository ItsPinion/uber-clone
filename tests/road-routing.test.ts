import test from "node:test";
import assert from "node:assert/strict";
import { createRoadRouteUrl, parseRoadRoute } from "../src/lib/road-routing";
import { VIZAG_LOCATIONS } from "../src/lib/ride";

const pickup = VIZAG_LOCATIONS[0];
const dropoff = VIZAG_LOCATIONS[2];

test("OSRM route requests use longitude,latitude and ask for full road geometry", () => {
  const url = new URL(createRoadRouteUrl(pickup, dropoff));
  assert.equal(url.origin, "https://router.project-osrm.org");
  assert.equal(url.pathname, "/route/v1/driving/83.3079,17.7288;83.3234,17.7126");
  assert.equal(url.searchParams.get("overview"), "full");
  assert.equal(url.searchParams.get("geometries"), "geojson");
  assert.equal(url.searchParams.get("steps"), "false");
});

test("OSRM GeoJSON coordinates are converted to Leaflet latitude,longitude order", () => {
  const route = parseRoadRoute({
    code: "Ok",
    routes: [{
      distance: 4100,
      duration: 780,
      geometry: { coordinates: [[83.3079, 17.7288], [83.316, 17.721], [83.3234, 17.7126]] },
    }],
  });

  assert.deepEqual(route, {
    coordinates: [[17.7288, 83.3079], [17.721, 83.316], [17.7126, 83.3234]],
    distanceMeters: 4100,
    durationSeconds: 780,
  });
});

test("malformed or unroutable OSRM responses use the straight-line fallback", () => {
  assert.equal(parseRoadRoute({ code: "NoRoute", routes: [] }), null);
  assert.equal(parseRoadRoute({ code: "Ok", routes: [{ distance: 1, duration: 2, geometry: { coordinates: [[83, 17]] } }] }), null);
  assert.equal(parseRoadRoute({ code: "Ok", routes: [{ distance: -1, duration: 2, geometry: { coordinates: [[83, 17], [84, 18]] } }] }), null);
});
