CREATE TABLE `ride_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ride_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE INDEX `ride_notifications_user_created_idx` ON `ride_notifications` (`user_id`,`created_at`);