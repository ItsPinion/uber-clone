import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { RideStatus } from "@/lib/ride";

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
