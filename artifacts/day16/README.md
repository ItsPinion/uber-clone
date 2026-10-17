# Day 16 notification verification captures

- `notifications-get-endpoint.png` is the actual `GET /api/notifications` handler response after seeding an account-owned ride and a cancellation notification.
- `notification-read-endpoint.png` is the actual `PATCH /api/notifications/[notificationId]` handler response for marking the owner's notification read.
- `notifications-read-all-endpoint.png` is the actual `PATCH /api/notifications` response after marking all of the account's unread notices read.
- `notifications-light-desktop.png`, `notifications-dark-desktop.png`, `notifications-light-mobile.png`, and `notifications-dark-mobile.png` show the notification panel in forced light/dark desktop and mobile viewports. The panel state and text are populated from the actual GET response; the isolated capture fixture mirrors the `NotificationBell` presentation without requiring Clerk credentials.

The endpoint harness uses a mocked Clerk identity and an in-memory SQLite database. The GET route returned 200 with two unread records; PATCH returned 200, and a follow-up GET showed only the targeted cancellation notification as read. The 390 px mobile capture measured a 390 px document width with the panel ending at x=378, so no horizontal overflow was detected. These are local verification captures, not a live authenticated deployment. WebSockets and operating-system push are not implemented.
