CREATE TABLE `users_trophies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` mediumint unsigned NOT NULL,
	`item_id` tinyint unsigned NOT NULL,
	`awarded_on` datetime NOT NULL,
	CONSTRAINT `users_trophies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `items` MODIFY COLUMN `url` varchar(24) NOT NULL;--> statement-breakpoint
ALTER TABLE `users_trophies` ADD CONSTRAINT `users_trophies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_trophies` ADD CONSTRAINT `users_trophies_item_id_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_id_awarded_on_idx` ON `users_trophies` (`user_id`,`awarded_on`);
