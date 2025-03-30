CREATE TABLE `dragcave_feed` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`guid` int unsigned,
	`link` text NOT NULL,
	CONSTRAINT `dragcave_feed_id` PRIMARY KEY(`id`),
	CONSTRAINT `dragcave_feed_guid_unique` UNIQUE(`guid`)
);
--> statement-breakpoint
CREATE TABLE `user_notifications` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` mediumint unsigned NOT NULL,
	`guid` int unsigned,
	`type` varchar(10),
	`valid_until` datetime,
	`content` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT NOW(),
	CONSTRAINT `user_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `created_at_valid_until_idx` ON `user_notifications` (`created_at`,`valid_until`);