ALTER TABLE `items` ADD `release_date` datetime DEFAULT '1970-01-01 00:00:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `days_available` smallint unsigned;