import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { RideStatus } from "@/lib/ride";

export const rideNotifications = sqliteTable(
  "ride_notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    rideId: text("ride_id").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    createdAt: text("created_at").notNull(),
    readAt: text("read_at"),
  },
  (table) => [index("ride_notifications_user_created_idx").on(table.userId, table.createdAt)],
);

export const rides = sqliteTable(
  "rides",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    driverUserId: text("driver_user_id"),
    createdAt: text("created_at").notNull(),
    status: text("status").$type<RideStatus>().notNull(),
    payload: text("payload").notNull(),
  },
  (table) => [index("rides_user_created_idx").on(table.userId, table.createdAt)],
);
