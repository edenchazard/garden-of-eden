CREATE TABLE `banner_jobs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` mediumint unsigned NOT NULL,
	`username` varchar(32) NOT NULL,
	`flair_path` varchar(100),
	`dragons_included` json,
	`dragons_omitted` json,
	`stat_gen_time` mediumint unsigned,
	`dragon_fetch_time` mediumint unsigned,
	`dragon_gen_time` mediumint unsigned,
	`frame_gen_time` mediumint unsigned,
	`gif_gen_time` mediumint unsigned,
	`total_time` mediumint unsigned,
	`error` text,
	`created_at` datetime NOT NULL DEFAULT NOW(),
	CONSTRAINT `banner_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD CONSTRAINT `banner_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;