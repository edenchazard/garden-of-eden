CREATE TABLE `users_trophies` (
	`user_id` mediumint unsigned NOT NULL,
	`item_id` tinyint unsigned NOT NULL,
	`awarded_on` datetime NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users_trophies` ADD CONSTRAINT `users_trophies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_trophies` ADD CONSTRAINT `users_trophies_item_id_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE restrict ON UPDATE no action;