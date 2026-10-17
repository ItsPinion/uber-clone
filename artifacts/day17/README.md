# Day 17 notification inbox verification captures

- `notifications-unread-endpoint.png` captures the actual authenticated `GET /api/notifications?filter=unread&limit=2` response. It contains the first two unread records and a continuation cursor.
- `notifications-cursor-endpoint.png` captures the next page returned by the same handler when that cursor is supplied.
- `notification-inbox-light-desktop.png`, `notification-inbox-dark-desktop.png`, `notification-inbox-light-mobile.png`, `notification-inbox-dark-mobile.png`, and `notification-inbox-light-narrow.png` show the inbox layout in forced themes at desktop, 390 px mobile, and 320 px narrow widths. The isolated visual fixture uses records from the actual API response to represent the UI without a live Clerk browser session.

Both API captures came from the real route handler with a mocked Clerk identity and in-memory SQLite lifecycle data; each returned HTTP 200, with five unread notices and stable page boundaries. The narrow-layout check measured a 320 px document width at a 320 px viewport; the 390 px layout also has no horizontal overflow. These screenshots are local verification captures, not a live authenticated deployment.
