# Day 15 driver-matching verification captures

- `driver-offers-endpoint.png` shows the actual `GET /api/driver/rides` handler returning a seeded open ride.
- `driver-accept-endpoint.png` shows the actual `PATCH /api/driver/rides/[rideId]` handler assigning that offer to the authorized demo driver.
- `driver-offers-light-desktop.png`, `driver-offers-dark-desktop.png`, and `driver-offers-light-mobile.png` show the driver queue with a representative seeded offer. The mobile capture uses a 390 px viewport and had no horizontal overflow.

For these screenshots, Clerk identity and offer data were mocked in a temporary local capture harness; endpoint handlers and the `DriverExperience` component are from the app. The screenshots are visual verification, not a live authenticated deployment. Configure `CABBOOK_DRIVER_USER_IDS` with actual Clerk IDs to enable driver access in a deployment.
