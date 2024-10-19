CREATE TABLE `items` (
	`id` tinyint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(24) NOT NULL,
	`url` varchar(24),
	`category` varchar(24) NOT NULL,
	`available_from` datetime,
	`available_to` datetime,
	`description` varchar(255) NOT NULL,
	`cost` smallint,
	`artist` varchar(64),
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`item_id` tinyint unsigned NOT NULL,
	`user_id` mediumint unsigned NOT NULL,
	`purchased_on` datetime DEFAULT NOW(),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_settings` ADD `flair_id` tinyint unsigned;--> statement-breakpoint
ALTER TABLE `users` ADD `money` smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_item_id_items_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_flair_id_items_id_fk` FOREIGN KEY (`flair_id`) REFERENCES `items`(`id`) ON DELETE set null ON UPDATE no action;