CREATE TABLE `hatchery` (
	`code` char(5) NOT NULL COLLATE 'utf8mb3_bin',
	`user_id` mediumint unsigned NOT NULL,
	`in_seed_tray` boolean NOT NULL DEFAULT false,
	`in_garden` boolean NOT NULL DEFAULT false,
	CONSTRAINT `hatchery_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `recordings` (
	`recorded_on` datetime NOT NULL DEFAULT NOW(),
	`value` bigint unsigned NOT NULL,
	`record_type` varchar(24) NOT NULL,
	`extra` json
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` mediumint unsigned NOT NULL,
	`username` varchar(32) NOT NULL,
	`role` varchar(10) NOT NULL DEFAULT 'user',
	`registered_on` datetime NOT NULL DEFAULT NOW(),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` mediumint unsigned NOT NULL,
	`gardenFrequency` smallint NOT NULL DEFAULT 30,
	`gardenPerPage` smallint NOT NULL DEFAULT 50,
	`seedTrayFrequency` smallint NOT NULL DEFAULT 30,
	`seedTrayPerPage` smallint NOT NULL DEFAULT 50,
	`sort` varchar(32) NOT NULL DEFAULT 'Youngest First',
	`hatchlingMinAge` tinyint NOT NULL DEFAULT 0,
	`eggMinAge` tinyint NOT NULL DEFAULT 0,
	`showScrollRatio` boolean NOT NULL DEFAULT false,
	`autoSeedTray` boolean NOT NULL DEFAULT true,
	CONSTRAINT `user_settings_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `hatchery` ADD CONSTRAINT `hatchery_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;