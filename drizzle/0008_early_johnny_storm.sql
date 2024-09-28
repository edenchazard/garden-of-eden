CREATE TABLE `clicks` (
	`hatchery_id` char(5) NOT NULL,
	`user_id` mediumint unsigned NOT NULL,
	`clicked_on` datetime NOT NULL DEFAULT NOW(),
	CONSTRAINT `hatchery_id_user_id_idx` UNIQUE(`hatchery_id`,`user_id`)
);
--> statement-breakpoint
ALTER TABLE `user_settings` ADD `highlightClickedDragons` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `clicks` ADD CONSTRAINT `clicks_hatchery_id_hatchery_id_fk` FOREIGN KEY (`hatchery_id`) REFERENCES `hatchery`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clicks` ADD CONSTRAINT `clicks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;