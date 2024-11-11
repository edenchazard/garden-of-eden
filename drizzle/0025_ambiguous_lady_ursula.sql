CREATE TABLE `banner_jobs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` mediumint unsigned NOT NULL,
	`generated_on` datetime NOT NULL DEFAULT NOW(),
	CONSTRAINT `banner_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD CONSTRAINT `banner_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;