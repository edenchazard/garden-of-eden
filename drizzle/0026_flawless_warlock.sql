ALTER TABLE `banner_jobs` ADD `username` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `name` varchar(24);--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `statGenTime` mediumint unsigned;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `dragonFetchTime` mediumint unsigned;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `dragonGenTime` mediumint unsigned;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `frameGenTime` mediumint unsigned;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `gifGenTime` mediumint unsigned;--> statement-breakpoint
ALTER TABLE `banner_jobs` ADD `totalTime` mediumint unsigned;