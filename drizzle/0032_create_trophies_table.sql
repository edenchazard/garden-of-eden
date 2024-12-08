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

INSERT INTO `items` (`name`, `url`, `category`, `available_from`, `available_to`, `description`, `cost`, `artist`) VALUES
	('1st Place', 'trophies/1.webp', 'flair', NULL, NULL, '', NULL, 'Arcy'),
	('2nd Place', 'trophies/2.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('3rd Place', 'trophies/3.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('4th Place', 'trophies/4.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('5th Place', 'trophies/5.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('6th Place', 'trophies/6.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('7th Place', 'trophies/7.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('8th Place', 'trophies/8.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('9th Place', 'trophies/9.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy'),
	('10th Place', 'trophies/10.webp', 'trophy', NULL, NULL, '', NULL, 'Arcy');
