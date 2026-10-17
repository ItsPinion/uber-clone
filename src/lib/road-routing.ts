import type { RideLocation } from "@/lib/ride";

export type RoadRoute = {
  /** Leaflet order: [latitude, longitude]. */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
};

// The public OSRM demo router is suitable for light demos; use a hosted or self-hosted router at production scale.
export function createRoadRouteUrl(pickup: RideLocation, dropoff: RideLocation) {
  const coordinates = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const query = new URLSearchParams({ overview: "full", geometries: "geojson", steps: "false" });
  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?${query}`;
}

export function parseRoadRoute(payload: unknown): RoadRoute | null {
  if (!payload || typeof payload !== "object") return null;

  const response = payload as {
    code?: unknown;
    routes?: Array<{
      distance?: unknown;
      duration?: unknown;
      geometry?: { coordinates?: unknown };
    }>;
  };

  const route = response.routes?.[0];
  const rawCoordinates = route?.geometry?.coordinates;
  if (response.code !== "Ok" || !route || !Array.isArray(rawCoordinates)) return null;

  const coordinates = rawCoordinates.flatMap((coordinate): [number, number][] => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return [];
    const [longitude, latitude] = coordinate;
    if (typeof latitude !== "number" || typeof longitude !== "number" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [[latitude, longitude]];
  });

  if (coordinates.length < 2) return null;
  if (typeof route.distance !== "number" || !Number.isFinite(route.distance) || route.distance < 0) return null;
  if (typeof route.duration !== "number" || !Number.isFinite(route.duration) || route.duration < 0) return null;

  return { coordinates, distanceMeters: route.distance, durationSeconds: route.duration };
}
