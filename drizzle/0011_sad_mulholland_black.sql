CREATE TABLE `clicks_leaderboard` (
	`user_id` mediumint unsigned NOT NULL,
	`leaderboard` varchar(10) NOT NULL,
	`start` datetime NOT NULL,
	`rank` mediumint unsigned NOT NULL,
	`clicks_given` bigint unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `leaderboard_user_id_idx` UNIQUE(`leaderboard`,`user_id`)
);
--> statement-breakpoint
ALTER TABLE `clicks_leaderboard` ADD CONSTRAINT `clicks_leaderboard_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `clicks_given_idx` ON `clicks_leaderboard` (`clicks_given`);