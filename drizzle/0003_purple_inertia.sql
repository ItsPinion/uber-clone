CREATE TABLE `notification_push_subscriptions` (
	`endpoint` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notification_push_subscriptions_user_idx` ON `notification_push_subscriptions` (`user_id`);