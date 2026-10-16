export type RideLocation = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export type RideCategory = "mini" | "comfort" | "xl";
export type RideStatus = "requested" | "accepted" | "in_progress" | "completed" | "declined" | "cancelled";

export type DemoDriver = {
  name: string;
  vehicle: string;
  plate: string;
  pickupEtaMinutes: number;
};

export type SavedRideRequest = {
  id: string;
  createdAt: string;
  pickup: RideLocation;
  dropoff: RideLocation;
  distanceKm: number;
  fare: number;
  category: RideCategory;
  status: RideStatus;
  driver?: DemoDriver;
};

export const VIZAG_LOCATIONS: RideLocation[] = [
  { id: "dwaraka", name: "Dwaraka Nagar", area: "Central Vizag", lat: 17.7288, lng: 83.3079 },
  { id: "railway", name: "Visakhapatnam Railway Station", area: "Railway New Colony", lat: 17.7175, lng: 83.2967 },
  { id: "rk-beach", name: "Ramakrishna Beach", area: "Beach Road", lat: 17.7126, lng: 83.3234 },
  { id: "airport", name: "Visakhapatnam Airport", area: "Gajuwaka", lat: 17.7212, lng: 83.2245 },
  { id: "rushikonda", name: "Rushikonda Beach", area: "Rushikonda", lat: 17.7827, lng: 83.3853 },
  { id: "simhachalam", name: "Simhachalam Temple", area: "Simhachalam", lat: 17.765, lng: 83.202 },
  { id: "steel-plant", name: "Steel Plant Gate", area: "Ukkunagaram", lat: 17.626, lng: 83.136 },
];

export const DEMO_DRIVER_LOCATION: RideLocation = VIZAG_LOCATIONS[0];

const RIDE_PRICING: Record<RideCategory, { baseFare: number; perKm: number; label: string; capacity: string }> = {
  mini: { baseFare: 45, perKm: 15, label: "CabBook Mini", capacity: "1–3 seats" },
  comfort: { baseFare: 70, perKm: 20, label: "CabBook Comfort", capacity: "1–4 seats" },
  xl: { baseFare: 110, perKm: 27, label: "CabBook XL", capacity: "1–6 seats" },
};

export function getRidePricing(category: RideCategory) {
  return RIDE_PRICING[category];
}

export function calculateDistanceKm(origin: RideLocation, destination: RideLocation) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDiff = toRadians(destination.lat - origin.lat);
  const lngDiff = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);
  const haversine =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lngDiff / 2) ** 2;
  const straightLineKm = 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));

  // Allow a modest detour factor as a route estimate until a routing API is configured.
  return Math.max(1, Math.round(straightLineKm * 1.28 * 10) / 10);
}

export function rankRideOffers(requests: SavedRideRequest[], driverLocation: RideLocation) {
  return requests
    .filter((ride) => ride.status === "requested")
    .map((ride) => ({
      ride,
      pickupDistanceKm: calculateDistanceKm(driverLocation, ride.pickup),
      pickupEtaMinutes: Math.max(3, Math.ceil(calculateDistanceKm(driverLocation, ride.pickup) * 3 + 2)),
    }))
    .sort((first, second) => first.pickupDistanceKm - second.pickupDistanceKm);
}

export function estimateFare(distanceKm: number, category: RideCategory) {
  const { baseFare, perKm } = RIDE_PRICING[category];
  const rawFare = Math.max(baseFare, baseFare + distanceKm * perKm);
  return Math.ceil(rawFare / 10) * 10;
}

export function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
